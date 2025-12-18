# Interactive 3D Portfolio

A high-end, interactive portfolio website that reimagines navigation as a 3D physics playground. Built with **Three.js** and **Cannon-es**.

## 🎮 Experience
Instead of clicking links, users interact with a physical world:
*   **Physics-Based Navigation**: 3D blocks ("SKILLS", "PROJECTS", "ACTIVITIES") drop from the ceiling on load.
*   **Interactive Play**: Users can drag, throw, and stack the blocks using the mouse.
*   **Light Triggers**: Dragging a block into the central spotlight triggers a "Particle Flare" and navigates to the corresponding section.

## 🛠️ Tech Stack
*   **Three.js**: 3D rendering, lighting, and scene management.
*   **Cannon-es**: Real-time physics simulation (gravity, collisions, constraints).
*   **GSAP (GreenSock)**: Smooth camera movements and scroll animations.
*   **Post-Processing**: UnrealBloomPass for glowing, atmospheric lighting.

## 🌐 Deployment & Infrastructure
This project is deployed to **[junwei-li.com](https://junwei-li.com)** using a fully automated CI/CD pipeline.
*   **AWS S3**: Static asset hosting.
*   **AWS CloudFront**: CDN for global high-performance content delivery.
*   **AWS Route53**: DNS management.
*   **AWS ACM**: SSL/TLS certificate management for secure HTTPS.
*   **CI/CD**: Automated build and deployment pipeline.

## 🚀 Setup
1.  **Clone** or download this repository.
2.  **Run** a local development server (recommended for loading 3D models and textures correctly).
    *   *VS Code*: Right-click `index.html` -> "Open with Live Server".
    *   *Python*: `python -m http.server`
3.  **Open** the localhost URL in your browser.

## 📂 Project Structure
*   `index.html`: Main entry point.
*   `css/`
    *   `main/style.css`: Global styles.
*   `js/`
    *   `main/`: Core 3D logic (main event loop, scene setup, physics objects).
*   `media/`: 
    *   `main/`: 3D assets (e.g., lamp model).
    *   `activities/`: Videos and images for activity pages.
*   `html/`: Feature pages (Activities, Skills, Projects).

## ✨ Credits
Designed and built by Junwei Li.
