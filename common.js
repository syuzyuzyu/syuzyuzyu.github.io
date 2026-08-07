// ===== Safe event bindings (replaces inline onclick/javascript handlers) =====
document.querySelectorAll('[data-action="open-chat"]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (link.classList.contains('plan-card__cta')) {
            e.stopPropagation();
        }
        if (window.HubSpotConversations?.widget?.open) {
            window.HubSpotConversations.widget.open();
        }
    });
});

document.querySelectorAll('.plan-diagnostic__option').forEach(btn => {
    btn.addEventListener('click', function () {
        selectDiagnosticOption(this.dataset.group, this.dataset.value, this);
    });
});

document.querySelectorAll('[data-action="show-estimate"]').forEach(btn => {
    btn.addEventListener('click', function (e) {
        e.preventDefault();
        showOmakaseEstimate();
    });
});

document.querySelectorAll('[data-action="email-link"]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        OnLinkClick();
    });
});

// ===== Smooth scrolling for navigation links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== Scroll animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll(
    '.animate-on-scroll, .animate-left, .animate-right, .animate-scale, .stagger-item'
).forEach(el => observer.observe(el));

// ===== Scroll progress bar =====
const header = document.querySelector('.header');
const toggleHeaderVisibility = () => {
    if (!header) return;
    const shouldShow = window.scrollY > 80;
    header.classList.toggle('is-visible', shouldShow);
    header.style.boxShadow = shouldShow ? '0 4px 15px rgba(0,0,0,0.15)' : '0 2px 5px rgba(0,0,0,0.1)';
};

const scrollProgress = document.querySelector('.scroll-progress');

window.addEventListener('scroll', () => {
    toggleHeaderVisibility();

    if (!scrollProgress) return;
    const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    scrollProgress.style.width = scrolled + '%';
});

toggleHeaderVisibility();

// ===== Interactive hover effects =====
document.querySelectorAll('.feature-card, .service-item, .tob-service-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

// ===== Hero slide carousel =====
// 個人向けページのヒーローのみスライドを持つ。法人向けページは静止画1枚（.tob-hero）で
// .hero-slide が存在しないため、下の length ガードで何も起きない。
const slides = document.querySelectorAll('.hero-slide');
let current = 0;

function showNextSlide() {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
}

if (slides.length > 0) {
    setInterval(showNextSlide, 5000);
}

// ===== Service modal =====
const serviceModal = document.getElementById('service-modal');
const serviceModalTitle = document.getElementById('service-modal-title');
const serviceModalBody = document.getElementById('service-modal-body');
const serviceModalClose = document.getElementById('service-modal-close');

function openServiceModal(title, desc) {
    if (!serviceModal || !serviceModalTitle || !serviceModalBody) return;
    serviceModalTitle.textContent = title;
    serviceModalBody.innerHTML = `<p>${desc}</p>`;
    serviceModal.classList.add('is-open');
    serviceModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
}

function openModalHTML(title, html) {
    if (!serviceModal || !serviceModalTitle || !serviceModalBody) return;
    serviceModalTitle.textContent = title;
    serviceModalBody.innerHTML = html;
    serviceModal.classList.add('is-open');
    serviceModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
}

function closeServiceModal() {
    if (!serviceModal) return;
    serviceModal.classList.remove('is-open');
    serviceModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
}

document.querySelectorAll('.service-nav-item').forEach(button => {
    const serviceBackground = button.dataset.serviceBg;
    const serviceOverlay = button.dataset.serviceOverlay;
    if (serviceBackground) {
        button.style.setProperty('--service-bg', serviceBackground);
    }
    if (serviceOverlay) {
        button.style.setProperty('--service-overlay', serviceOverlay);
    }

    button.addEventListener('click', () => {
        openServiceModal(
            button.dataset.serviceTitle || '',
            button.dataset.serviceDesc || ''
        );
    });
});

// ===== Fee diagnostic tool (toC) =====
const diagnosticAnswers = { property: null, tax: null, banks: null };

function selectDiagnosticOption(group, value, btn) {
    diagnosticAnswers[group] = value;
    btn.parentElement.querySelectorAll('.plan-diagnostic__option').forEach(b => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
}

function computeOmakaseEstimate(hasProperty, tax, banks) {
    if (tax === 'yes') {
        if (banks === 'le2') return { plan: 'フル', range: '100万円〜120万円' };
        if (banks === '3to4') return { plan: 'フル', range: '120万円〜150万円' };
        return { plan: 'フル（複雑なケース）', isQuote: true };
    }
    if (banks === 'ge5') {
        return { plan: (hasProperty ? '標準' : 'ライト') + '（複雑なケース）', isQuote: true };
    }
    const result = hasProperty
        ? (banks === 'le2' ? { plan: '標準', range: '50万円〜65万円' } : { plan: '標準', range: '65万円〜80万円' })
        : (banks === 'le2' ? { plan: 'ライト', range: '35万円〜50万円' } : { plan: 'ライト', range: '50万円〜65万円' });
    if (tax === 'unknown') {
        result.note = '相続税が発生する場合は「フル」（100万円〜）が目安になります。まずは無料相談で財産状況をご確認ください。';
    }
    return result;
}

function showOmakaseEstimate() {
    const { property, tax, banks } = diagnosticAnswers;
    const resultEl = document.getElementById('omakase-result');
    if (!property || !tax || !banks) {
        alert('3つの質問すべてにお答えください');
        return;
    }
    const result = computeOmakaseEstimate(property === 'yes', tax, banks);
    const amountText = result.isQuote ? '個別お見積もり' : result.range;
    const headline = result.isQuote
        ? `<strong>あなたの場合は個別お見積もりとなります</strong>（${result.plan}タイプ相当）`
        : `<strong>あなたの場合の目安は【${result.range}】前後です</strong>（${result.plan}タイプ相当）`;
    resultEl.innerHTML = headline
        + (result.note ? `<p style="margin-top:0.5rem;font-size:0.85em;">${result.note}</p>` : '')
        + `<a href="#plan-types" class="plan-diagnostic__arrow">対応方針はこちら<span class="plan-diagnostic__arrow-icon" aria-hidden="true">▼</span></a>`;
    resultEl.classList.add('is-visible');

    const omakasePrice = document.getElementById('omakase-card-price');
    if (omakasePrice) omakasePrice.textContent = amountText;

    const planTypesSection = document.getElementById('plan-types');
    if (planTypesSection) {
        planTypesSection.classList.remove('is-hidden');
        planTypesSection.querySelectorAll('.animate-on-scroll').forEach(el => el.classList.add('visible'));
    }
}

// ===== Plan card modal (toC) =====
const planContent = {
    guide: {
        title: 'ガイドタイプ',
        html: `
            <p>「自分で進めたいけれど、どこから始めればいいか分からない」という方のための、無料の伴走型サポートです。</p>
            <p><strong>ご利用方法：</strong>事前予約制のweb会議にて、ご状況をお伺いしながら進め方をご案内します。お電話やメールでの簡易なご質問ではなく、最高3度程度のやりとりを通じて理解を深めることができますs</p>
            <ul class="plan-card__list">
                <li>進め方の整理と手順のご案内</li>
                <li>必要書類や確認事項のアドバイスと解説</li>
                <li>ご自身で動くためのガイド</li>
            </ul>
            <p><strong>料金：無料</strong>（事前予約制のweb会議でのご案内が前提です）</p>
            <p>ご相談の中で「やはり難しい」「時間がない」と感じられた場合は、別途切り替が可能です。</p>
        `
    },
    omakase: {
        title: 'お任せタイプ',
        html: `
            <p>相続手続きをすべてお任せいいただくタイプです。手続きの数や専門性に応じて金額が上下し、当事務所では、財産の種別や金額に応じて大きく金額が異なります。</p>
            <ul class="plan-card__list">
                <li><strong>ライト（35〜65万円）：</strong>不動産なし・相続税なしの方向け。戸籍収集・財産調査・遺産分割協議書作成など、基本となる手続きを一括対応します。</li>
                <li><strong>標準（50〜80万円）：</strong>不動産ありの方向け。ライトの内容に加え、不動産の名義変更登記（司法書士が対応）が含まれます。</li>
                <li><strong>フル（100〜150万円）：</strong>相続税が発生する方向け。標準の内容に加え、相続税申告（税理士が対応）が含まれます。150万円を超える複雑なケースもございます。</li>
            </ul>
            <p>詳しい料金は初回相談後の調査を経て詳しいお見積りをご提示いたします。</p>
        `
    },
    custom: {
        title: 'オーダーメイドタイプ',
        html: `
            <p>「任せられるところだけ任せたい」という方向けに、必要な作業だけを個別にお引き受けする対応です。下記の中から、ご希望の作業をお選びいただけます（一部抜粋）。</p>
            <ul class="plan-card__list">
                <li>役所への各種届出サポート</li>
                <li>戸籍収集・相続関係説明図の作成</li>
                <li>法定相続情報一覧図の作成</li>
                <li>財産調査・残高証明書の取得</li>
                <li>財産目録の作成</li>
                <li>遺産分割協議書の作成</li>
                <li>農地転用許可・届出手続き</li>
                <li>デジタル遺産（パソコン・スマートフォン）の調査</li>
                <li>その他、戸籍・財産・名義変更等に関する各種手続き</li>
            </ul>
            <p>料金は作業内容ごとの個別お見積りとなります。ご希望の作業をお伺いした上で、詳しい料金は初回相談後の調査を経てお見積り、実施事項ごご選択となります。</p>
        `
    }
};

document.querySelectorAll('.plan-card').forEach(card => {
    const planKey = card.dataset.plan;
    const content = planContent[planKey];
    if (!content) return;

    const open = () => openModalHTML(content.title, content.html);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open();
        }
    });
});

serviceModalClose?.addEventListener('click', closeServiceModal);
serviceModal?.addEventListener('click', (event) => {
    if (event.target === serviceModal) {
        closeServiceModal();
    }
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeServiceModal();
    }
});

// ===== Email link (obfuscated) =====
function OnLinkClick() {
    const encoded = [
        "&#x6d;", "&#x61;", "&#x69;", "&#x6c;", "&#x74;", "&#x6f;", "&#x3a;", "&#x73;", "&#x75;", "&#x7a;", "&#x75;", "&#x6b;", "&#x69;", "&#x2d;", "&#x6b;", "&#x65;", "&#x6e;", "&#x6a;", "&#x69;", "&#x40;", "&#x67;", "&#x79;", "&#x6f;", "&#x75;", "&#x73;", "&#x65;", "&#x69;", "&#x64;", "&#x65;", "&#x73;", "&#x69;", "&#x67;", "&#x6e;", "&#x2e;", "&#x63;", "&#x6f;", "&#x6d;", "&#x3f;", "&#x73;", "&#x75;", "&#x62;", "&#x6a;", "&#x65;", "&#x63;", "&#x74;", "&#x3d;", "&#x76f8;", "&#x8ac7;", "&#x4f9d;", "&#x983c;", "&#x26;", "&#x62;", "&#x6f;", "&#x64;", "&#x79;", "&#x3d;", "&#x4f55;", "&#x3082;", "&#x5165;", "&#x529b;", "&#x305b;", "&#x305a;", "&#x306b;", "&#x3053;", "&#x306e;", "&#x307e;", "&#x307e;", "&#x30e1;", "&#x30fc;", "&#x30eb;", "&#x3092;", "&#x9001;", "&#x4fe1;", "&#x3057;", "&#x3066;", "&#x304f;", "&#x3060;", "&#x3055;", "&#x30e1;", "&#x30fc;", "&#x30eb;", "&#x3092;", "&#x9001;", "&#x4fe1;", "&#x3057;", "&#x3066;", "&#x304f;", "&#x3060;", "&#x3055;", "&#x3044;", "&#x3002;", "&#x53d7;", "&#x4fe1;", "&#x78ba;", "&#x8a8d;", "&#x5f8c;", "&#x6298;", "&#x308a;", "&#x8fd4;", "&#x3057;", "&#x306e;", "&#x30e1;", "&#x30fc;", "&#x30eb;", "&#x3092;", "&#x9001;", "&#x4fe1;", "&#x3044;", "&#x305f;", "&#x3057;", "&#x307e;", "&#x3059;", "&#x3002;"
    ];
    const temp = document.createElement("textarea");
    temp.innerHTML = encoded.join("");
    const email = temp.value;
    location.href = `${email}`;
}
