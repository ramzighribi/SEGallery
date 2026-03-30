import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import GalleryPage from './pages/GalleryPage';
import UploadPage from './pages/UploadPage';
import DetailPage from './pages/DetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<GalleryPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/component/:id" element={<DetailPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
