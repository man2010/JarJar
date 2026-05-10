import { AuthProvider, useAuth } from './hooks/useAuth';
import { useRouter } from './hooks/useRouter';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './views/Landing';
import Feed from './views/Feed';
import PostDetail from './views/PostDetail';
import NewPost from './views/NewPost';
import Login from './views/Login';
import Register from './views/Register';
import Profile from './views/Profile';
import Bookmarks from './views/Bookmarks';
import Collecte from './views/Collecte';
import Collectes from './views/Collectes';
import CollecteDetail from './views/CollecteDetail';
import Admin from './views/Admin';
import Notifications from './views/Notifications';
import FooterPage from './views/FooterPage';

function AppContent() {
  const { route } = useRouter();
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
          <p className="text-sm text-stone-400">Chargement...</p>
        </div>
      </div>
    );
  }

  const path = route.path;
  let page: React.ReactNode;

  if (path === '/') {
    page = <Landing />;
  } else if (path === '/feed') {
    page = <Feed />;
  } else if (path.startsWith('/post/')) {
    page = <PostDetail id={route.params.id} />;
  } else if (path === '/new') {
    page = <NewPost />;
  } else if (path.startsWith('/edit/')) {
    page = <NewPost editId={route.params.id} />;
  } else if (path === '/login') {
    page = <Login />;
  } else if (path === '/register') {
    page = <Register />;
  } else if (path.startsWith('/profile/')) {
    page = <Profile username={route.params.username} />;
  } else if (path === '/bookmarks') {
    page = <Bookmarks />;
  } else if (path === '/notifications') {
    page = <Notifications />;
  } else if (path === '/collecte') {
    page = <Collecte />;
  } else if (path === '/collectes') {
    page = <Collectes />;
  } else if (path.startsWith('/collecte/')) {
    page = <CollecteDetail id={route.params.id} />;
  } else if (path === '/admin') {
    page = <Admin />;
  } else if (path.startsWith('/footer/')) {
    page = <FooterPage slug={route.params.slug} />;
  } else {
    page = <Landing />;
  }

  const hideNavFooter = path === '/login' || path === '/register';

  return (
    <div className="min-h-screen bg-stone-50">
      {!hideNavFooter && <Navbar />}
      <main>{page}</main>
      {!hideNavFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
