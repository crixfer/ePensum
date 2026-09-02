export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-6">
      <p className="text-center text-xs text-muted-foreground">
        © {year} ePensum · Desarrollado por crixfer · Todos los derechos reservados
      </p>
    </footer>
  );
}
