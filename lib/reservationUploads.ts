import { supabase } from "@/lib/supabase";

export type ReservationUploadTypeKey =
  | "accommodation"
  | "flight"
  | "train"
  | "bus"
  | "carRental"
  | "activities";

export interface ReservationUploadOption {
  key: ReservationUploadTypeKey;
  label: string;
  icon: string;
  iconColor: string;
  iconBgClassName: string;
  bucket: "accommodations" | "transport" | "activities";
}

export interface PendingReservationUpload {
  id: string;
  typeKey: ReservationUploadTypeKey;
  name: string;
  uri: string;
  mimeType: string;
  size?: number;
  kind: "image" | "document";
  status: "pending" | "uploading" | "uploaded" | "error";
  storagePath?: string;
  publicUrl?: string;
  uploadedAt?: string;
}

export interface UploadedReservationFileMetadata {
  typeKey: ReservationUploadTypeKey;
  label: string;
  bucket: ReservationUploadOption["bucket"];
  fileName: string;
  mimeType: string;
  size?: number;
  storagePath: string;
  publicUrl: string;
  uploadedAt: string;
}

export const RESERVATION_UPLOAD_OPTIONS: ReservationUploadOption[] = [
  {
    key: "accommodation",
    label: "Accommodation",
    icon: "bed",
    iconColor: "#3B82F6",
    iconBgClassName: "bg-blue-100",
    bucket: "accommodations",
  },
  {
    key: "flight",
    label: "Flight",
    icon: "airplane",
    iconColor: "#10B981",
    iconBgClassName: "bg-green-100",
    bucket: "transport",
  },
  {
    key: "train",
    label: "Train",
    icon: "train",
    iconColor: "#8B5CF6",
    iconBgClassName: "bg-purple-100",
    bucket: "transport",
  },
  {
    key: "bus",
    label: "Bus",
    icon: "bus",
    iconColor: "#F59E0B",
    iconBgClassName: "bg-yellow-100",
    bucket: "transport",
  },
  {
    key: "carRental",
    label: "Car Rental",
    icon: "car",
    iconColor: "#EF4444",
    iconBgClassName: "bg-red-100",
    bucket: "transport",
  },
  {
    key: "activities",
    label: "Activities",
    icon: "ticket",
    iconColor: "#EC4899",
    iconBgClassName: "bg-pink-100",
    bucket: "activities",
  },
];

export const getReservationUploadOption = (
  typeKey: ReservationUploadTypeKey,
) => RESERVATION_UPLOAD_OPTIONS.find((option) => option.key === typeKey);

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const mapBookingType = (typeKey: ReservationUploadTypeKey) => {
  switch (typeKey) {
    case "accommodation":
      return "hotel";
    case "activities":
      return "activity";
    case "carRental":
      return "car";
    default:
      return "flight";
  }
};

const uploadFileToBucket = async (
  bucket: ReservationUploadOption["bucket"],
  storagePath: string,
  upload: PendingReservationUpload,
) => {
  const response = await fetch(upload.uri);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, arrayBuffer, {
      contentType: upload.mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(storagePath);

  return publicUrl;
};

const persistTripUploadManifest = async (
  tripId: string,
  metadata: UploadedReservationFileMetadata[],
) => {
  if (!metadata.length) {
    return;
  }

  const payload = metadata.map((item) => ({
    trip_id: tripId,
    type: mapBookingType(item.typeKey),
    confirmation_number: `${item.bucket}:${item.storagePath}`,
    cost: 0,
  }));

  const { error: bookingsError } = await supabase.from("bookings").insert(payload);

  if (bookingsError) {
    throw bookingsError;
  }

  const tripMetadataPayload = metadata.map((item) => ({
    typeKey: item.typeKey,
    label: item.label,
    bucket: item.bucket,
    fileName: item.fileName,
    mimeType: item.mimeType,
    size: item.size,
    storagePath: item.storagePath,
    publicUrl: item.publicUrl,
    uploadedAt: item.uploadedAt,
  }));

  const candidateFields = ["reservation_uploads", "uploaded_files"];

  for (const field of candidateFields) {
    const { error } = await supabase
      .from("trips")
      .update({ [field]: tripMetadataPayload } as never)
      .eq("id", tripId);

    if (!error) {
      break;
    }
  }
};

export const uploadPendingReservationFilesForTrip = async (
  tripId: string,
  userId: string,
  uploadsByType: Partial<Record<ReservationUploadTypeKey, PendingReservationUpload[]>>,
) => {
  const uploaded: UploadedReservationFileMetadata[] = [];
  const failed: Array<{ upload: PendingReservationUpload; error: unknown }> = [];

  for (const option of RESERVATION_UPLOAD_OPTIONS) {
    const uploads = uploadsByType[option.key] || [];

    for (const upload of uploads) {
      const timestamp = Date.now();
      const sanitizedName = sanitizeFileName(upload.name || `${option.key}-${timestamp}`);
      const storagePath = `${userId}/${tripId}/${option.key}/${timestamp}-${sanitizedName}`;

      try {
        const publicUrl = await uploadFileToBucket(option.bucket, storagePath, upload);
        uploaded.push({
          typeKey: option.key,
          label: option.label,
          bucket: option.bucket,
          fileName: upload.name,
          mimeType: upload.mimeType,
          size: upload.size,
          storagePath,
          publicUrl,
          uploadedAt: new Date().toISOString(),
        });
      } catch (error) {
        failed.push({ upload, error });
      }
    }
  }

  if (uploaded.length) {
    await persistTripUploadManifest(tripId, uploaded);
  }

  return { uploaded, failed };
};