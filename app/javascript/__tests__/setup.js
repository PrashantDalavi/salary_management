import "@testing-library/jest-dom";

// Mock CSRF meta tag
const meta = document.createElement("meta");
meta.setAttribute("name", "csrf-token");
meta.setAttribute("content", "test-csrf-token");
document.head.appendChild(meta);

// Mock fetch globally
global.fetch = jest.fn();
