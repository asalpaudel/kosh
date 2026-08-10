interface HeaderProps {
  pageName: string;
}

export default function Header({ pageName }: HeaderProps) {
  return (
    <header className="bg-black h-16 md:h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <h1 className="text-white font-semibold text-lg md:text-2xl">{pageName}</h1>
    </header>
  );
}
