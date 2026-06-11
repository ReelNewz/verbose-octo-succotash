import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Newsroom from "./pages/Newsroom.tsx";
import NewsroomArticle from "./pages/NewsroomArticle.tsx";
import Resources from "./pages/Resources.tsx";
import Tip from "./pages/Tip.tsx";
import Podcast from "./pages/Podcast.tsx";
import Books from "./pages/Books.tsx";
import Shop from "./pages/Shop.tsx";
import Donate from "./pages/Donate.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import NotFound from "./pages/NotFound.tsx";
import NewsletterConfirm from "./pages/NewsletterConfirm.tsx";
import Auth from "./pages/Auth.tsx";
import { RequireAdmin } from "./components/RequireAdmin.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import ArticlesList from "./pages/admin/ArticlesList.tsx";
import ArticleEditor from "./pages/admin/ArticleEditor.tsx";
import CategoriesList from "./pages/admin/CategoriesList.tsx";
import ResourcesList from "./pages/admin/ResourcesList.tsx";
import ResourceEditor from "./pages/admin/ResourceEditor.tsx";
import DownloadsAnalytics from "./pages/admin/DownloadsAnalytics.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/newsroom" element={<Newsroom />} />
          <Route path="/newsroom/:slug" element={<NewsroomArticle />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/tip" element={<Tip />} />
          <Route path="/podcast" element={<Podcast />} />
          <Route path="/books" element={<Books />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/newsletter/confirm" element={<NewsletterConfirm />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<Dashboard />} />
            <Route path="articles" element={<ArticlesList />} />
            <Route path="articles/:id" element={<ArticleEditor />} />
            <Route path="categories" element={<CategoriesList />} />
            <Route path="resources" element={<ResourcesList />} />
            <Route path="resources/:id" element={<ResourceEditor />} />
            <Route path="downloads" element={<DownloadsAnalytics />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
