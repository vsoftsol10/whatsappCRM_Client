
// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import { Toaster } from "react-hot-toast";
// import './index.css'
// import App from './App.jsx'
// import ErrorBoundary from './components/ErrorBoundary.jsx'
// import { checkForNewBuild } from './utils/versionGuard.js'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <ErrorBoundary>
//       <App />
//     </ErrorBoundary>
//     <Toaster
//       position="top-right"
//       reverseOrder={false}
//       toastOptions={{
//         duration: 3000,
//       }}
//     />
//   </StrictMode>,
// )

// // Reload once if an older build is running
// checkForNewBuild()



import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from "react-hot-toast";
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { checkForNewBuild } from './utils/versionGuard.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Toaster
      position="top-right"
      reverseOrder={false}
      // Always render toasts above every popup/modal
      containerStyle={{ zIndex: 2147483647 }}
      toastOptions={{
        duration: 3000,
      }}
    />
  </StrictMode>,
)

// Reload once if an older build is running
checkForNewBuild()
