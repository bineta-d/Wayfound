# Reservation Tab & Scanner Feature Guide

## Logic Overview

- Each reservation icon acts as a tab. When clicked, set the active tab and display the relevant content area below.
- For each tab, fetch and render all files uploaded to the corresponding storage bucket for this trip (e.g., hotel/accommodation files from the 'accommodations' bucket, activity files from the 'activities' bucket).
- All transport files (flights, train, bus, car rental) can be stored in a single shared bucket (e.g., 'transport').
- Each file should be rendered as a clickable document (image, PDF, docx, etc.). On click, open a modal for full preview.
- Integrate the email-scanner feature so scanned reservation emails are parsed and uploaded to the correct bucket and shown in the relevant tab.

## Required Storage Buckets

- Create individual storage buckets for each reservation type:
  - accommodations
  - transport (for flights, train, bus, car rental)
  - activities
  - (currently only 'trip-uploads' exists)

## Email-Scanner Integration

- For each tab, integrate the email-scanner so reservation confirmation emails are parsed and relevant files (PDFs, screenshots, etc.) are automatically uploaded to the correct bucket and displayed in the tab.
- See the feature/email-scanner branch for implementation details.

## Next Steps

- Create individual storage buckets for each reservation type.
- Implement file fetching and rendering logic for each tab.
- Integrate email-scanner feature for automated uploads.

**Note:** The ReservationsSection component should remain unchanged for use in other screens. Do not modify the icon UI or styles.
