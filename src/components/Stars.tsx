import { useEffect } from 'react';

export default function Stars() {
  useEffect(() => {
    const createStars = () => {
      const starsContainer = document.querySelector('.stars');
      if (!starsContainer) return;

      // Reduzido de 100 para 50 estrelas
      const starsCount = 50;
      
      for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * 1.5 + 0.5; // Tamanho reduzido
        
        // Animação simplificada
        const delay = Math.random() * 4;
        const duration = Math.random() * 4 + 3;
        
        Object.assign(star.style, {
          left: `${x}%`,
          top: `${y}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          animation: `twinkle ${duration}s linear infinite`
        });
        
        starsContainer.appendChild(star);
      }
    };

    createStars();

    return () => {
      const starsContainer = document.querySelector('.stars');
      if (starsContainer) {
        starsContainer.innerHTML = '';
      }
    };
  }, []);

  return <div className="stars" />;
}