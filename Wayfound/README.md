# Wayfound

Wayfound is an AI-powered travel planner that centralizes bookings, maps, and itineraries into one system. It creates optimized, personalized trip plans based on time, budget, and preferences, adapts to real-time changes, and supports group travel with cost-splitting and collaboration tools.

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Git installed
- Code editor (VS Code recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bineta-d/Wayfound.git
   cd Wayfound
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - iOS: Press `i` in terminal or use Xcode simulator
   - Android: Press `a` in terminal or use Android emulator  
   - Web: Press `w` in terminal or open browser to localhost

### Common Issues
- Metro bundler errors: `npx expo start --clear`
- Dependency issues: Delete `node_modules` and run `npm install`

## Development Workflow

### Git Workflow

**Branch Naming Convention**
- New features: `feature/feature-name-here`
- Bug fixes: `fix/issue-description`
- Chores: `chore/task-description`

**Commit Message Format**
```
type: description

feat: add user authentication
fix: resolve navigation crash
chore: update dependencies
docs: update README
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `chore`: Maintenance task
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Adding/updating tests

### Team Guidelines

**Frequency**
- Commit frequently (every few changes)
- Push branches regularly
- Create pull requests for review

**Branch Strategy**
1. Create feature branch from `main`
2. Make changes and commit with proper format
3. Push to remote
4. Create pull request
5. Review and merge to `main`

## Project Structure

```
app/
├── _layout.tsx              # Root layout
├── index.tsx                # Home redirect
├── modal.tsx               # Modal screen
└── (tabs)/                # Tab navigation
    ├── _layout.tsx          # Tab layout
    ├── home.tsx             # Home screen
    ├── explore.tsx           # Explore destinations
    ├── create.tsx            # Create new trip
    ├── collaborate.tsx       # Team collaboration
    └── profile.tsx          # User profile

components/                 # Reusable components
lib/                       # Utilities and services
types/                      # TypeScript definitions
```

## Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **Language**: TypeScript
- **State Management**: React Context

## Features

- AI-powered trip planning
- Centralized booking management
- Interactive maps integration
- Dynamic itinerary generation
- Real-time trip adaptation
- Group travel collaboration
- Cost splitting tools
- Budget optimization

## Scripts

```bash
npm start          # Start development server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
```

## Contributing

1. Follow branch naming convention
2. Write clear commit messages
3. Test changes before committing
4. Create pull requests for review
5. Keep code clean and documented

## 🎨 Design System – Color Guide

Wayfound uses a bold, modern purple-based palette combined with energetic accent tones.  
The color system ensures consistency across screens and reinforces the brand identity of exploration, innovation, and collaboration.

---

### Primary Colors (Brand Identity)

| Name | Hex |
|------|------|
| Midnight Indigo | `#1B0F3B` |
| Royal Purple | `#3A1FA8` |
| Electric Violet | `#5B3DF5` |

**Usage**
- Navigation bars  
- Headers and hero sections  
- Brand gradients  
- Major visual emphasis areas  
- Selected tab indicators  

**Primary Gradient Standard**

```text
#1B0F3B → #3A1FA8 → #5B3DF5
```

---

### Accent Colors (Call-to-Action)

| Name | Hex |
|------|------|
| Crimson Magenta | `#D81E5B` |
| Hot Coral | `#FF4D4D` |

**Usage**
- Primary CTA buttons  
- Important highlights  
- Active states  
- Notification badges  
- Error indicators (Hot Coral)  

Accent colors should not be used as full-screen backgrounds.

---

### Glow Accents (Interactive Effects)

| Name | Hex |
|------|------|
| Neon Lilac | `#B58CFF` |
| Soft Pink Glow | `#F3A6C8` |

**Usage**
- Hover effects  
- Focus states  
- Subtle shadow glows  
- Selected cards  
- Animated UI emphasis  

Glow accents should be used sparingly.

---

### Neutral Colors (Structure & Typography)

| Name | Hex |
|------|------|
| Background | `#F5F6FA` |
| Surface | `#FFFFFF` |
| Text Primary | `#2A2E34` |
| Text Secondary | `#67717B` |
| Divider | `#D5D9DD` |

**Usage**
- App background: `#F5F6FA`  
- Cards and modals: `#FFFFFF`  
- Primary text: `#2A2E34`  
- Secondary text: `#67717B`  
- Dividers and borders: `#D5D9DD`  

---

## 📦 Component Usage Guidelines

### 🔘 Buttons

**Primary Button**
- Background: `#D81E5B`  
- Text: `#FFFFFF`  
- Focus glow: `#B58CFF`  

**Secondary Button**
- Background: `#FFFFFF`  
- Border & Text: `#3A1FA8`  
- Hover tint: `#F3A6C8`  

**Disabled Button**
- Background: `#D5D9DD`  
- Text: `#67717B`  

---

### 🧭 Navigation Bar

- Background: `#1B0F3B`  
- Active tab: `#5B3DF5`  
- Icons/Text: `#FFFFFF`  

---

### 🧾 Cards

- Background: `#FFFFFF`  
- Title text: `#2A2E34`  
- Subtitle text: `#67717B`  
- Selected border: `#B58CFF`  

---

## 🚫 Usage Rules

- Do not use glow colors as full backgrounds.  
- Do not mix multiple accent colors in a single component.  
- Maintain sufficient contrast for accessibility.  
- Primary brand colors should be used for structural elements (headers, navigation).

