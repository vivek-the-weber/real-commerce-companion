import logo from '@/assets/logo.png';

export default function LogoDisplay() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <img src={logo} alt="AuraEdge Logo" className="max-w-md w-full" />
    </div>
  );
}
