import Sidebar from './Sidebar';

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      <Sidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
