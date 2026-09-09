import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children, bare = false }) {
  return (
    <div className="flex min-h-screen flex-col">
      {!bare && <Navbar />}
      <main className="flex-1">{children}</main>
      {!bare && <Footer />}
    </div>
  );
}
