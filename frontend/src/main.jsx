// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import { Toaster } from "react-hot-toast";
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//     <Toaster
//       position="top-right"
//       reverseOrder={false}
//       toastOptions={{
//         duration: 3000,
//       }}
//     />
//   </StrictMode>,
// )

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from "react-hot-toast";
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 3000,
      }}
    />
  </StrictMode>,
)
