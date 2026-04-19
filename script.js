document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const priceInput = document.getElementById('price');
    const productNameInput = document.getElementById('product-name');
    const salaryInput = document.getElementById('monthly-salary');
    const resultSection = document.getElementById('result-section');
    
    const hoursResult = document.getElementById('hours-result');
    const cdResult = document.getElementById('cd-result');
    const matrixStatus = document.getElementById('matrix-status');
    const daysResult = document.getElementById('days-result');
    const visualBar = document.getElementById('visual-bar');
    const emotionalMessage = document.getElementById('emotional-message');
    const shareBtn = document.getElementById('share-btn');
    const verdictCard = document.getElementById('verdict-card');
    const verdictText = document.getElementById('verdict-text');
    
    const aiVerdictCard = document.getElementById('ai-verdict-card');
    const aiVerdictText = document.getElementById('ai-verdict-text');
    
    // API KEY Logic (Secure - loaded from localStorage)
    const apiInput = document.getElementById('api-key-input');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const saveSettings = document.getElementById('save-settings');
    
    let OPENAI_API_KEY = localStorage.getItem('openai_api_key') || "";
    if (OPENAI_API_KEY) apiInput.value = OPENAI_API_KEY;

    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
    });

    saveSettings.addEventListener('click', () => {
        const key = apiInput.value.trim();
        if (key) {
            localStorage.setItem('openai_api_key', key);
            OPENAI_API_KEY = key;
            settingsPanel.classList.add('hidden');
            alert('¡Clave guardada correctamente!');
        }
    });

    const chips = document.querySelectorAll('.chip');
    let selectedCategory = 'lujo';
    let currentCD = 0;
    let currentHours = 0;

    // Chip selection logic
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedCategory = chip.dataset.category;
        });
    });

    // Initial load animations
    gsap.to('.header-top, header p', { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: 'power3.out' });
    gsap.to('main', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.4 });

    calculateBtn.addEventListener('click', calculateImpact);
    
    // Enable calculation on Enter key
    [priceInput, salaryInput, productNameInput].forEach(input => {
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                calculateImpact();
            }
        });
    });

    async function calculateImpact() {
        const price = parseFloat(priceInput.value);
        const monthlySalary = parseFloat(salaryInput.value);
        const productName = productNameInput.value.trim();

        if (isNaN(price) || isNaN(monthlySalary) || price <= 0 || monthlySalary <= 0 || !productName) {
            alert('Por favor, introduce valores numéricos válidos y el nombre del producto.');
            return;
        }

        // SDN = Sueldo Diario Neto
        const sdn = monthlySalary / 30;
        const cd = price / sdn; // Costo en Días
        currentCD = cd;

        // Complementary: Hours of life (assuming 160h work month)
        const hourlyWage = monthlySalary / 160;
        const hours = price / hourlyWage;
        const days = hours / 8;
        currentHours = hours;

        showResults(cd, hours, days, sdn);
        
        // Trigger AI Verdict
        getAIVerdict(productName, price, selectedCategory, cd);
    }

    function showResults(cd, hours, days, sdn) {
        // Display result section if hidden
        if (resultSection.classList.contains('hidden')) {
            resultSection.classList.remove('hidden');
            gsap.fromTo(resultSection, 
                { height: 0, opacity: 0 }, 
                { height: 'auto', opacity: 1, duration: 0.6, ease: 'power3.out' }
            );
        }
        
        // Animate elements inside result card
        gsap.fromTo([hoursResult, cdResult, matrixStatus, daysResult, emotionalMessage], 
            { y: 20, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)' }
        );

        // Format numbers
        const formattedCD = cd.toFixed(1);
        const formattedHours = hours.toFixed(1);

        cdResult.textContent = `${formattedCD} Días de Esfuerzo (CD)`;
        hoursResult.textContent = `${formattedHours} Horas de Vida`;
        
        // Decision Matrix
        const decision = getMatrixDecision(cd, selectedCategory);
        matrixStatus.textContent = decision.label;
        matrixStatus.style.backgroundColor = decision.bgColor;
        matrixStatus.style.color = decision.textColor;

        daysResult.textContent = `Sueldo diario: ${sdn.toFixed(2)}€ | Categoría: ${selectedCategory.toUpperCase()}`;

        updateVisuals(cd, decision.level);
        setEmotionalMessage(decision.level, hours);
        setVerdict(decision, cd);
    }

    async function getAIVerdict(product, price, category, cd) {
        aiVerdictCard.classList.remove('hidden');
        gsap.to(aiVerdictCard, { opacity: 1, scale: 1, duration: 0.5 });

        if (!OPENAI_API_KEY) {
            aiVerdictText.textContent = "⚠️ Configura tu API Key en los ajustes (icono ⚙️ arriba) para recibir el veredicto de la IA.";
            return;
        }

        aiVerdictText.textContent = "Consultando a mi cerebro superior...";
        aiVerdictText.classList.add('typing');

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: "Eres un asesor financiero viral, sarcástico y un poco 'judgy'. Tu objetivo es evaluar si una compra es estúpida o genial basándote en el Índice de Retorno Personal (IRP). Sé breve (máximo 2-3 frases), usa emojis y sé un poco burlón si el Costo en Días (CD) es alto para un Lujo."
                        },
                        {
                            role: "user",
                            content: `Producto: ${product}. Precio: ${price}€. Categoría: ${category}. Costo en Días (CD): ${cd.toFixed(1)}. ¿Qué opinas?`
                        }
                    ],
                    temperature: 0.8
                })
            });

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            typeWriter(aiVerdictText, aiResponse);
        } catch (error) {
            aiVerdictText.textContent = "La IA está descansando ahora mismo... pero mi veredicto humano sigue en pie.";
            console.error("OpenAI Error:", error);
        } finally {
            aiVerdictText.classList.remove('typing');
        }
    }

    function typeWriter(element, text, i = 0) {
        if (i === 0) element.textContent = '';
        if (i < text.length) {
            element.textContent += text.charAt(i);
            setTimeout(() => typeWriter(element, text, i + 1), 25);
        }
    }

    function getMatrixDecision(cd, cat) {
        // Matrix logic according to user request
        if (cd <= 2) {
            if (cat === 'inversion') return { label: '⭐ Excelente', level: 'low', bgColor: '#dcfce7', textColor: '#166534' };
            if (cat === 'utilidad') return { label: '✅ Muy Buena', level: 'low', bgColor: '#dcfce7', textColor: '#166534' };
            return { label: '✅ Aceptable', level: 'low', bgColor: '#f0f9ff', textColor: '#075985' };
        } 
        if (cd <= 5) {
            if (cat === 'inversion') return { label: '✅ Buena', level: 'med', bgColor: '#fef9c3', textColor: '#854d0e' };
            if (cat === 'utilidad') return { label: '⚠️ Límite', level: 'med', bgColor: '#ffedd5', textColor: '#9a3412' };
            return { label: '❌ Mala Compra', level: 'high', bgColor: '#fee2e2', textColor: '#991b1b' };
        }
        if (cd <= 15) {
            if (cat === 'inversion') return { label: '⚠️ Analizar', level: 'med', bgColor: '#ffedd5', textColor: '#9a3412' };
            if (cat === 'utilidad') return { label: '❌ Mala Compra', level: 'high', bgColor: '#fee2e2', textColor: '#991b1b' };
            return { label: '🚫 Error Financiero', level: 'extreme', bgColor: '#7f1d1d', textColor: '#ffffff' };
        }
        // +15 days
        if (cat === 'inversion') return { label: '🔍 Solo con Ahorro', level: 'high', bgColor: '#fef9c3', textColor: '#854d0e' };
        if (cat === 'utilidad') return { label: '🚫 No Comprar', level: 'extreme', bgColor: '#fee2e2', textColor: '#991b1b' };
        return { label: '‼️ Peligro de Deuda', level: 'extreme', bgColor: '#450a0a', textColor: '#ffffff' };
    }

    function updateVisuals(cd, level) {
        const colors = {
            low: '#3b82f6',
            med: '#f59e0b',
            high: '#ef4444',
            extreme: '#7f1d1d'
        };

        // Bar width based on CD (30 days = 100%)
        let fillPercentage = (cd / 30) * 100;
        if (fillPercentage > 100) fillPercentage = 100;
        if (fillPercentage < 2) fillPercentage = 2;

        gsap.to(visualBar, {
            width: `${fillPercentage}%`,
            backgroundColor: colors[level],
            boxShadow: `0 0 15px ${colors[level]}`,
            duration: 1.2,
            ease: "power2.out",
            delay: 0.2
        });
        
        gsap.to(hoursResult, { color: colors[level], duration: 0.5 });
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

    function setVerdict(decision, cd) {
        verdictCard.classList.remove('hidden');
        
        let msg = "";
        let isBad = decision.level === 'high' || decision.level === 'extreme' || decision.label.includes('Límite');
        
        // Context based on category
        if (selectedCategory === 'inversion') {
            msg = "Como es una **Inversión (Activo)**, sacrificas esfuerzo presente por una herramienta que trabajará para ti durante años.";
        } else if (selectedCategory === 'utilidad') {
            msg = "Esta es una compra de **Utilidad**. No deberías trabajar más de una semana completa para pagar algo que se depreciará.";
        } else {
            msg = "Esto es **Lujo/Gasto**. Si trabajas más de 48h para un capricho efímero, estás quemando demasiado tiempo vital.";
        }

        if (isBad) {
            msg += "<br><br>💡 **Factor de Corrección:** Solo es buena compra si puedes pagarla **3 veces en efectivo** ahora mismo sin tocar tus ahorros de emergencia.";
        }

        verdictText.innerHTML = msg;
        
        gsap.fromTo(verdictCard, 
            { scale: 0.9, opacity: 0 }, 
            { scale: 1, opacity: 1, duration: 0.5, delay: 0.4, ease: 'back.out(1.2)' }
        );
        
        gsap.to(verdictCard, { borderColor: decision.textColor, duration: 0.5 });
    }

    // Share functionality
    shareBtn.addEventListener('click', async () => {
        const text = `Este capricho me cuesta ${currentCD.toFixed(1)} días de mi vida (${currentCD > 2 ? '⚠️' : '✅'}).\n\nDescubre tu Índice de Retorno Personal aquí:`;
        
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
