import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children, bare = false }) {
  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-hidden">
      {!bare && <Navbar />}
      <main className="w-full min-w-0 flex-1">{children}</main>
      {!bare && <Footer />}
    </div>
  );
}
