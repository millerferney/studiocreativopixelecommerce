import { Navbar } from "@/components/tienda/Navbar";
import { Footer } from "@/components/tienda/Footer";
import { CartDrawer } from "@/components/tienda/CartDrawer";
import { AuthModal } from "@/components/tienda/AuthModal";

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <Navbar />
      {children}
      <Footer />
      <CartDrawer />
      <AuthModal />
    </>
  );
}
