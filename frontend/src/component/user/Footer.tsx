export default function Footer() {
  return (
    <footer className="h-12 flex items-center justify-center text-gray-500 text-sm border-t">
      © {new Date().getFullYear()} Kosh. All rights reserved.
    </footer>
  );
}
