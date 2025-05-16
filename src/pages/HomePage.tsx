import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/restaurantes');
  }, [navigate]);
  return (
    <div className="min-h-screen pb-24 sm:pb-32">
      {/* Conteúdo da página inicial, se houver */}
    </div>
  );
}
