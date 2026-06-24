const container = document.getElementById('projetos-container');
const countEl = document.getElementById('projetos-count');

// ===== CARREGAR PROJETOS =====
fetch('projetos.json')
    .then(res => res.json())
    .then(data => {
        const projetos = Array.isArray(data) ? data : (data.projetos || []);
        const finalistas = data.finalistas || [];

        renderPodium(finalistas);

        countEl.textContent = projetos.length;
        projetos.sort((a, b) => b.id - a.id);

        projetos.forEach(p => {
            const card = document.createElement('div');
            card.className = 'projeto-card';

            // ===== TRATAMENTO DA THUMBNAIL =====
            const thumbSrc = p.thumb && p.thumb.trim() !== '' 
                ? p.thumb 
                : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"%3E%3Crect width="400" height="250" fill="%23f0f3f0"/%3E%3Ctext x="200" y="125" font-family="Arial" font-size="18" fill="%23aaa" text-anchor="middle"%3E%3C/title%3ESem imagem%3C/title%3ESem imagem%3C/text%3E%3C/svg%3E';
            // Fallback: usa um SVG com texto "Sem imagem"

            // ===== TRATAMENTO DO VÍDEO =====
            const hasVideo = p.video && p.video.trim() !== '';
            const videoDataAttr = hasVideo ? `data-video="${p.video}"` : '';
            const videoOverlay = hasVideo ? `
                <div class="video-overlay">
                    <span class="play-indicator">▶</span>
                </div>
            ` : '';

            // ===== BOTÃO DO VÍDEO =====
            const videoButton = hasVideo 
                ? `<a href="#" class="video-link" data-video="${p.video}">Vídeo</a>`
                : `<span class="video-link disabled" style="color:#ccc;cursor:default;">Sem vídeo</span>`;

            card.innerHTML = `
                <div class="thumbnail-wrapper" ${videoDataAttr}>
                    <img src="${thumbSrc}" alt="${p.projeto}" loading="lazy" 
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22250%22 viewBox=%220 0 400 250%22%3E%3Crect width=%22400%22 height=%22250%22 fill=%22%23f0f3f0%22/%3E%3Ctext x=%22200%22 y=%22125%22 font-family=%22Arial%22 font-size=%2218%22 fill=%22%23aaa%22 text-anchor=%22middle%22%3ESem imagem%3C/text%3E%3C/svg%3E'">
                    ${videoOverlay}
                </div>
                <div class="projeto-info">
                    <div class="titulo">${p.projeto}</div>
                    <div class="autor">${p.nome}</div>
                    ${p.descricao ? `<div class="descricao">${p.descricao}</div>` : ''}
                    <div class="links">
                        <a href="${p.github}" target="_blank">GitHub</a>
                        ${videoButton}
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        setupModal();
    })
    .catch(() => {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; color:#999; padding:4rem 0;">
                <p>Nenhum projeto encontrado.</p>
            </div>
        `;
    });

// ===== MODAL (com verificação de vídeo) =====
function setupModal() {
    const modal = document.getElementById('video-modal');
    const modalContent = document.querySelector('.modal-content');
    const close = document.getElementById('modal-close');
    let isOpen = false;

    function extractYouTubeId(url) {
        if (!url) return null;
        if (url.includes('youtu.be/')) {
            const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
            return match ? match[1] : null;
        }
        if (url.includes('watch?v=')) {
            const match = url.match(/v=([a-zA-Z0-9_-]{11})/);
            return match ? match[1] : null;
        }
        if (url.includes('/embed/')) {
            const match = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
            return match ? match[1] : null;
        }
        if (url.length === 11) return url;
        return null;
    }

    function openModal(videoUrl) {
        // ===== VERIFICA SE O VÍDEO EXISTE =====
        if (!videoUrl || videoUrl.trim() === '') {
            alert('Este projeto ainda não possui um vídeo disponível.');
            return;
        }

        const videoId = extractYouTubeId(videoUrl);
        const frame = document.getElementById('video-frame');
        
        if (!videoId) {
            frame.src = videoUrl + '?autoplay=1&rel=0';
        } else {
            frame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        isOpen = true;
    }

    function closeModal() {
        const frame = document.getElementById('video-frame');
        frame.src = '';
        const parent = frame.parentNode;
        const newFrame = document.createElement('iframe');
        newFrame.id = 'video-frame';
        newFrame.src = '';
        newFrame.frameborder = '0';
        newFrame.allowfullscreen = true;
        parent.replaceChild(newFrame, frame);
        
        modal.classList.remove('active');
        document.body.style.overflow = '';
        isOpen = false;
    }

    // Abrir via thumbnail ou link
    document.addEventListener('click', (e) => {
        const thumb = e.target.closest('.thumbnail-wrapper');
        const link = e.target.closest('.video-link');

        if (thumb) {
            const url = thumb.dataset.video;
            if (url) {
                e.preventDefault();
                openModal(url);
            }
        }

        if (link) {
            const url = link.dataset.video;
            if (url) {
                e.preventDefault();
                openModal(url);
            }
        }
    });

    close.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) {
            closeModal();
        }
    });
}

// ===== PÓDIO (mesmo de antes) =====
function renderPodium(finalistas) {
    const podiumContainer = document.getElementById('podium-container');
    if (!podiumContainer) return;

    if (!finalistas || finalistas.length === 0) {
        podiumContainer.innerHTML = `
            <div class="podium-item segundo">
                <div class="posicao">II</div>
                <div class="podium-column">
                    <div class="podium-icon">2</div>
                    <span class="podium-placeholder-text">Aguardando<br>finalistas</span>
                </div>
                <span class="podium-badge">Segundo</span>
            </div>

            <div class="podium-item primeiro">
                <div class="posicao">I</div>
                <div class="podium-column">
                    <div class="podium-icon camisa-icon">👕</div>
                    <span class="podium-nome-projeto">Camisa Alpha</span>
                    <span class="podium-autor">1º lugar</span>
                </div>
                <span class="podium-badge">Primeiro</span>
            </div>

            <div class="podium-item terceiro">
                <div class="posicao">III</div>
                <div class="podium-column">
                    <div class="podium-icon">3</div>
                    <span class="podium-placeholder-text">Aguardando<br>finalistas</span>
                </div>
                <span class="podium-badge">Terceiro</span>
            </div>
        `;
        return;
    }

    const sorted = [...finalistas].sort((a, b) => a.posicao - b.posicao);
    const posicoes = {
        1: { classe: 'primeiro', label: 'Primeiro', roman: 'I' },
        2: { classe: 'segundo', label: 'Segundo', roman: 'II' },
        3: { classe: 'terceiro', label: 'Terceiro', roman: 'III' }
    };

    const ordemVisual = [2, 1, 3];
    let html = '';

    ordemVisual.forEach(pos => {
        const finalista = sorted.find(f => f.posicao === pos);
        const info = posicoes[pos];

        if (!finalista) {
            html += `
                <div class="podium-item ${info.classe}" style="opacity:0.3;">
                    <div class="posicao">${info.roman}</div>
                    <div class="podium-column">
                        <div class="podium-icon" style="background:#e8e8e8;border-color:#ddd;color:#bbb;">?</div>
                        <span class="podium-placeholder-text">Aguardando</span>
                    </div>
                    <span class="podium-badge">${info.label}</span>
                </div>
            `;
            return;
        }

        const isFirst = pos === 1;
        html += `
            <div class="podium-item ${info.classe}">
                <div class="posicao">${info.roman}</div>
                <div class="podium-column">
                    ${isFirst ? 
                        `<div class="podium-icon camisa-icon">👕</div>` :
                        `<div class="podium-icon">${pos}</div>`
                    }
                    <span class="podium-nome-projeto">${finalista.projeto}</span>
                    <span class="podium-autor">${finalista.nome}</span>
                </div>
                <span class="podium-badge">${info.label}</span>
            </div>
        `;
    });

    podiumContainer.innerHTML = html;
}