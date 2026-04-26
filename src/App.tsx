import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './layout/SiteLayout'
import { AboutPage } from './pages/AboutPage'
import { ConverterPage } from './pages/ConverterPage'
import { DisclosurePage } from './pages/DisclosurePage'
import { HomePage } from './pages/HomePage'
import { NewsPage } from './pages/NewsPage'
import { ServicesPage } from './pages/ServicesPage'
import { routerBasename } from './siteNav'

export default function App() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="converter" element={<ConverterPage />} />
          <Route path="disclosure" element={<DisclosurePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
