# d-experience

An interactive 3D web experience built with modern web technologies, combining a gamified 3D environment with standard web interfaces.

## 🚀 Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) & [TanStack Router](https://tanstack.com/router)
- **3D Rendering:** [React Three Fiber](https://r3f.docs.pmnd.rs/) & [Drei](https://github.com/pmndrs/drei)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/) (via shadcn/ui)
- **Backend & Auth:** [Supabase](https://supabase.com/)
- **Build Tooling:** [Vite](https://vitejs.dev/) & [Bun](https://bun.sh/)
- **Deployment:** Ready for Cloudflare Pages / Workers

## 📂 Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── lab/         # Interactive UI elements (CLI, HUD, QuestTracker)
│   │   ├── ui/          # Reusable shadcn/ui React components
│   │   └── world/       # 3D models and mechanics (Character, Joystick, VoxelWorld)
│   ├── integrations/
│   │   └── supabase/    # Supabase authentication and database clients
│   ├── routes/          # TanStack Router file-based route definitions
│   └── lib/             # Global states (gameStore), utilities, and game logic
├── api/                 # Backend API routes / handlers
├── public/              # Static assets
└── supabase/            # Supabase configuration and database migrations
```

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed locally.
- A [Supabase](https://supabase.com/) project (optional, but needed for backend logic).

### Installation

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/Satishacharya31/d-experience.git
   cd d-experience
   bun install
   ```

2. Configure Environment Variables:
   Create a `.env` file in the root and add your Supabase credentials.
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Start the Development Server:
   ```bash
   bun run dev
   ```
   The application will be available at `http://localhost:5173` (or the port specified by Vite).

### Building for Production

To build the project:
```bash
bun run build
# OR
bun run build:vite
```

To preview the built project:
```bash
bun run preview
```

## 🎮 Features

- **3D Voxel World**: Explore the interactive world with virtual joysticks and WebGL rendering.
- **Quest System**: Level up system, interactive boot sequence, and heads-up displays (HUD).
- **Authentication**: Fully integrated user authentication using Supabase.
- **Responsive UI**: Built using Radix UI primitives ensuring an accessible and adaptive layout. 

## 📜 Scripts overview

- `dev` - Starts the Vite development server.
- `build` - Full build script running `build.mjs`.
- `lint` - Runs ESLint to check for code issues.
- `format` - Uses Prettier to format source code.