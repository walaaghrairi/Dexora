import { ReactNode } from 'react';

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header would go here */}
      <main className="container mx-auto p-4">{children}</main>
      {/* Footer would go here */}
    </div>
  );
};

export default Layout;
