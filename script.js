document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const priceInput = document.getElementById('price');
    const wageInput = document.getElementById('wage');
    const resultSection = document.getElementById('result-section');
    
    const hoursResult = document.getElementById('hours-result');
    const daysResult = document.getElementById('days-result');
    const visualBar = document.getElementById('visual-bar');
    const emotionalMessage = document.getElementById('emotional-message');
    const shareBtn = document.getElementById('share-btn');
    
    let currentHours = 0;

    calculateBtn.addEventListener('click', calculateImpact);
    
    // Enable calculation on Enter key
    [priceInput, wageInput].forEach(input => {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                calculateImpact();
            }
        });
    });

    function calculateImpact() {
        const price = parseFloat(priceInput.value);
        const wage = parseFloat(wageInput.value);

        if (isNaN(price) || isNaN(wage) || price <= 0 || wage <= 0) {
            alert('Por favor, introduce valores numéricos válidos y mayores a 0.');
            return;
        }

        const hours = price / wage;
        const days = hours / 8; // assuming an 8-hour workday
        currentHours = hours;

        showResults(hours, days);
    }

    function showResults(hours, days) {
        // Display result section if hidden
        resultSection.classList.remove('hidden');
        
        // Remove animation class to reset it
        hoursResult.classList.remove('pop-in');
        
        // Trigger reflow
        void hoursResult.offsetWidth;
        
        // Add animation class
        hoursResult.classList.add('pop-in');

        // Format numbers
        const formattedHours = hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1);
        const formattedDays = days < 0.1 ? (days * 8).toFixed(1) + ' horas' : days.toFixed(1);

        hoursResult.textContent = `${formattedHours} hora${hours !== 1 ? 's' : ''}`;
        
        if (days < 1) {
             daysResult.textContent = `Menos de 1 día de trabajo`;
        } else {
             daysResult.textContent = `Casi ${formattedDays} día${days !== 1 ? 's' : ''} de trabajo`;
        }

        // Determine impact level
        let level = 'low';
        if (hours > 40) {
            level = 'extreme';
        } else if (hours > 16) {
            level = 'high';
        } else if (hours > 8) {
            level = 'med';
        }

        updateVisuals(hours, level);
        setEmotionalMessage(level, hours);
    }

    function updateVisuals(hours, level) {
        const colors = {
            low: 'var(--impact-low)',
            med: 'var(--impact-med)',
            high: 'var(--impact-high)',
            extreme: 'var(--impact-extreme)'
        };

        // Determine bar width (cap at 100%, 100% = 160 hours / 1 month)
        let fillPercentage = (hours / 160) * 100;
        if (fillPercentage > 100) fillPercentage = 100;
        if (fillPercentage < 2) fillPercentage = 2; // minimum visibility

        // Animate width
        setTimeout(() => {
            visualBar.style.width = `${fillPercentage}%`;
            visualBar.style.backgroundColor = colors[level];
            hoursResult.style.color = colors[level];
            
            // Add a glow effect matching the color
            visualBar.style.boxShadow = `0 0 10px ${colors[level]}`;
        }, 100);
    }

    function setEmotionalMessage(level, hours) {
        const messages = {
            low: [
                "No está mal… pero sigue siendo tiempo de tu vida.",
                "Un pequeño capricho justificado.",
                "Equivale a una buena peli. ¡Disfrútalo!"
            ],
            med: [
                "Hmm… esto ya empieza a doler.",
                "Piénsalo bien. Son un par de días de puro esfuerzo.",
                "Es un compromiso considerable. ¿Seguro que lo necesitas?"
            ],
            high: [
                "¿De verdad quieres cambiar tantos días de tu vida por esto?",
                "Uy... eso es mucho, muchísimo madrugar.",
                "Toda una semana trabajando solo para pagar esto."
            ],
            extreme: [
                "¡Alerta! Estás entregando semanas de tu vida.",
                "Esa compra se va a llevar gran parte de tu mes.",
                "Piénsalo 3 veces antes de dárselo a alguien más."
            ]
        };

        const randomMsg = messages[level][Math.floor(Math.random() * messages[level].length)];
        emotionalMessage.textContent = randomMsg;
    }

    // Share functionality
    shareBtn.addEventListener('click', async () => {
        const formattedHours = currentHours % 1 === 0 ? currentHours.toFixed(0) : currentHours.toFixed(1);
        const text = `Este capricho cuesta ${formattedHours} horas de mi vida 😳.\n\nDescubre cuánto cuestan tus compras en tiempo de vida:`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: '¿Cuántas horas de tu vida cuesta?',
                    text: text,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Error compartiendo:', err);
            }
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                const originalHTML = shareBtn.innerHTML;
                shareBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ¡Copiado al portapapeles!
                `;
                shareBtn.style.color = 'var(--impact-low)';
                shareBtn.style.borderColor = 'var(--impact-low)';
                
                setTimeout(() => {
                    shareBtn.innerHTML = originalHTML;
                    shareBtn.style.color = 'var(--text-main)';
                    shareBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }, 2500);
            });
        }
    });
});
