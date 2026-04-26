// Entry point for the build script in your package.json
import "@hotwired/turbo-rails"
import "./controllers"
import * as bootstrap from "bootstrap"

// React
import React from "react"
import { createRoot } from "react-dom/client"
import App from "./components/App"

const container = document.getElementById("root")
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}
