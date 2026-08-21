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
            <p><strong>ご利用方法：</strong>専用の手順webページを確認しながらご自身で作業を進めていただきます。不明点等がある場合予約制のweb会議にて、不明点を相談することが可能です。最高3回のやりとりを通じて理解を深めることができます。</p>
            <ul class="plan-card__list">
                <li>進め方の整理と手順のご案内</li>
                <li>必要書類や確認事項のアドバイスと解説</li>
                <li>ご自身で動くためのガイド</li>
                <li>期間は最大10ヶ月</li>
            </ul>
            <p><strong>料金：無料</strong>（手順ページでの実施、最大3回[各1時間まで]事前予約制のweb会議でのご案内が前提です）</p>
            <p>ご相談の中で「やはり難しい」「時間がない」と感じられた場合は、別途切り替が可能です。</p>
        `
    },
    omakase: {
        title: 'お任せタイプ',
        // このプランの詳細文はHTML側の #omakase-detail-content（is-hidden）に静的に置いてあり、
        // クリック時にそこから読み出す。クリック時にJSがinnerHTMLを新規生成する方式にすると、
        // ページ読み込み時点のDOMに文言が存在せず検索エンジンに読まれないため、
        // 「なぜこの金額か」等の訴求文はDOM上の静的ソースを持たせている（docs/Phase1/03参照）。
        sourceId: 'omakase-detail-content'
    },
    custom: {
        title: 'オーダーメイドタイプ',
        // omakaseと同様、文言はHTML側の #custom-detail-content（is-hidden）に静的に置き、
        // クリック時にそこから読み出す（docs/Phase1/03参照）。
        sourceId: 'custom-detail-content'
    }
};

document.querySelectorAll('.plan-card').forEach(card => {
    const planKey = card.dataset.plan;
    const content = planContent[planKey];
    if (!content) return;

    const open = () => {
        const html = content.sourceId
            ? (document.getElementById(content.sourceId)?.innerHTML || '')
            : content.html;
        openModalHTML(content.title, html);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open();
        }
    });
});

// ===== toC「相続でやることガイド」（/guide/）: 用語解説モーダル =====
// プラン詳細モーダル（omakase/custom）と同じ仕組みで、文言はHTML側の #glossary-* （is-hidden）に
// 静的に置いておき、クリック時にそこから読み出す（検索エンジンにも読める状態を保つため）。
const glossaryTitles = {
    souzokunin: '相続人調査とは',
    koseki: '戸籍収集とは',
    kennin: '検認とは',
    houki: '相続放棄・限定承認とは',
    zaisan: '相続財産の把握とは',
    bunkatsu: '遺産分割協議とは',
    touki: '相続登記（不動産の名義変更）とは'
};

document.querySelectorAll('[data-glossary]').forEach(btn => {
    const key = btn.dataset.glossary;
    const title = glossaryTitles[key];
    if (!title) return;

    btn.addEventListener('click', () => {
        const html = document.getElementById(`glossary-${key}`)?.innerHTML || '';
        openModalHTML(title, html);
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

// ===== 適性診断（/soudan/ 相談先ガイドページ） =====
// 「そもそも当事務所が自分に合っているか」を検討の入口段階で判断してもらうための2段階診断。
// Q1で争いの有無（弁護士マターかどうか）を確認し、
// Q2で手続きの数・種類を確認して窓口一本化の価値が活きるかを判定する（docs/Phase1/07参照）。
(function () {
    const root = document.getElementById('affinity-diagnostic');
    if (!root) return;

    const q1Options = root.querySelectorAll('[data-affinity-q1]');
    const q2Block = document.getElementById('affinity-q2');
    const q2Checks = root.querySelectorAll('.affinity-diagnostic__checks input[type="checkbox"]');
    const submitBtn = document.getElementById('affinity-submit');
    const resultEl = document.getElementById('affinity-result');

    function showResult(html) {
        resultEl.innerHTML = html;
        resultEl.classList.add('is-visible');
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    q1Options.forEach(btn => {
        btn.addEventListener('click', () => {
            q1Options.forEach(b => b.classList.remove('is-selected'));
            btn.classList.add('is-selected');
            resultEl.classList.remove('is-visible');
            resultEl.innerHTML = '';

            if (btn.dataset.affinityQ1 === 'yes') {
                q2Block.classList.add('is-hidden');
                const lawyerSearchUrl = 'https://www.google.com/search?q=' + encodeURIComponent('仙台 相続 弁護士');
                showResult(`
                    <p><strong>まずは弁護士へのご相談をお勧めします。</strong></p>
                    <p>相続人同士で意見の対立がある場合や連絡が取れない方がいる場合は、弁護士による交渉・調停が必要です。お住まいの地域で弁護士をお探しください。</p>
                    <a href="${lawyerSearchUrl}" class="cta-button" target="_blank" rel="noopener">弁護士を探す</a>
                `);
            } else {
                q2Block.classList.remove('is-hidden');
            }
        });
    });

    // 手続きを3つの領域に分類する：
    // - SHIHO（不動産の名義変更＝登記）：司法書士の専管業務
    // - ZEI（相続税の申告）：税理士の専管業務
    // - GYOSEI（それ以外：預貯金解約・自動車名義変更・農地届出・デジタル資産・各種解約）：行政書士が幅広く対応
    // 中立性を保つため、GYOSEI以外の領域だけで完結する場合は当事務所を介さず外部検索へ誘導し、
    // 当事務所の紹介はGYOSEIが絡むケースに限って行う（2026年8月改訂、事務所側ヒアリング結果に基づく）。
    submitBtn?.addEventListener('click', () => {
        const checked = Array.from(q2Checks).filter(c => c.checked).map(c => c.value);
        const hasShiho = checked.includes('realestate');
        const hasZei = checked.includes('tax');
        const hasGyosei = checked.some(v => ['bank', 'car', 'farmland', 'digital', 'subscriptions'].includes(v));

        const shihoSearchUrl = 'https://www.google.com/search?q=' + encodeURIComponent('仙台 相続 司法書士');
        const zeiSearchUrl = 'https://www.google.com/search?q=' + encodeURIComponent('仙台 相続 税理士');

        const shihoBtn = `<a href="${shihoSearchUrl}" class="cta-button" target="_blank" rel="noopener">司法書士を探す</a>`;
        const zeiBtn = `<a href="${zeiSearchUrl}" class="cta-button" target="_blank" rel="noopener">税理士を探す</a>`;
        const plansBtn = `<a href="/#plans-toc" class="cta-button">料金プランの目安を見る</a>`;

        const officeBlock = (desc) => `
            <div class="affinity-diagnostic__office-block">
                <h4>当事務所について</h4>
                <p>${desc}</p>
                ${plansBtn}
            </div>
        `;

        if (hasShiho && !hasZei && !hasGyosei) {
            showResult(`
                <p><strong>不動産の名義変更のみで完結しそうです。</strong></p>
                <p>登記は司法書士の専管業務です。お近くの司法書士をお探しください。なお、法務局へご自身で申請することも可能です（申請書の作成・必要書類の収集はご自身で行う必要があります）。</p>
                <div class="affinity-diagnostic__actions">${shihoBtn}</div>
            `);
        } else if (hasZei && !hasShiho && !hasGyosei) {
            showResult(`
                <p><strong>相続税の申告のみで完結しそうです。</strong></p>
                <p>相続税の申告は税理士の専管業務です。お近くの税理士をお探しください。なお、税務署へご自身で申告することも可能です（申告書の作成・財産の評価はご自身で行う必要があります）。</p>
                <div class="affinity-diagnostic__actions">${zeiBtn}</div>
            `);
        } else if (hasShiho && hasZei && !hasGyosei) {
            showResult(`
                <p><strong>不動産の名義変更と相続税の申告が必要になりそうです。</strong></p>
                <p>登記は司法書士、相続税の申告は税理士がそれぞれ専門です。どちらもご自身で手続きすることは可能ですが、専門知識が必要なため専門家に依頼される方が多い手続きです。それぞれ直接お探しいただくこともできますし、まとめて進めたい場合は行政書士が窓口となって連携することも可能です。</p>
                <div class="affinity-diagnostic__actions">${shihoBtn}${zeiBtn}</div>
                ${officeBlock('登記・相続税申告以外にも、まとめてご依頼いただきたい手続きがある場合は、行政書士が窓口となり司法書士・税理士と連携して対応します。')}
            `);
        } else if (hasShiho && !hasZei && hasGyosei) {
            showResult(`
                <p><strong>不動産の名義変更に加えて、複数の手続きが必要になりそうです。</strong></p>
                <p>登記は司法書士の専管業務です。もちろんご自身で法務局に申請することも可能です。それ以外の手続き（戸籍収集・預貯金の解約など）も、ご自身で進められる部分があります。</p>
                <div class="affinity-diagnostic__actions">${shihoBtn}</div>
                ${officeBlock('登記以外の手続き（戸籍収集・預貯金の解約など）は行政書士が幅広く対応できます。行政書士が窓口となり、司法書士と連携して進めることも可能です。')}
            `);
        } else if (hasZei && !hasShiho && hasGyosei) {
            showResult(`
                <p><strong>相続税の申告に加えて、複数の手続きが必要になりそうです。</strong></p>
                <p>相続税の申告は税理士の専管業務です。もちろんご自身で税務署に申告することも可能です。それ以外の手続き（戸籍収集・預貯金の解約など）も、ご自身で進められる部分があります。</p>
                <div class="affinity-diagnostic__actions">${zeiBtn}</div>
                ${officeBlock('申告以外の手続き（戸籍収集・預貯金の解約など）は行政書士が幅広く対応できます。行政書士が窓口となり、税理士と連携して進めることも可能です。')}
            `);
        } else if (hasShiho && hasZei && hasGyosei) {
            showResult(`
                <p><strong>複数の専門家との連携が必要になりそうな、複雑なケースです。</strong></p>
                <p>不動産の名義変更（司法書士）・相続税の申告（税理士）に加え、複数の手続きが必要になりそうです。手続きが多岐にわたるため、いずれかの専門家を窓口にして、一括して依頼を進めることをおすすめします。</p>
                ${officeBlock('行政書士は登記・相続税申告以外の幅広い手続きを専門としており、窓口を一括して引き受けることができます。司法書士・税理士とも連携して対応しますので、複数の窓口に個別にご連絡いただく必要はありません。')}
            `);
        } else {
            // GYOSEIのみ、または何も選択されなかった場合
            showResult(`
                <p><strong>行政書士が対応する一般的な手続きの範囲です。</strong></p>
                <p>戸籍収集、預貯金の解約、自動車の名義変更など、登記や相続税を伴わない手続きが中心になりそうです。もちろんこれらの手続きはご自身で進めることも可能です（役所や金融機関とのやり取り、必要書類の収集はご自身で行う必要があります）。</p>
                ${officeBlock('ご依頼はまだ早いかもしれません。まずはご自身で進められる部分のやり方を包み隠さずお伝えしています。難しいと感じた部分だけ、あとからお任せいただくことも可能です。')}
            `);
        }
    });
})();

// ===== toB「現在募集中の主な制度」フィード（GAS API から動的取得） =====
// このサイトは静的ホスティング（サーバーサイド無し）のため、API仕様書が本来推奨する
// 「サーバー経由（Next.js API Route等）での呼び出し」ができず、やむを得ずブラウザから直接POSTしている。
// そのため SECRET_TOKEN はページの通信内容（ネットワークタブ）・ソースから誰でも参照できる状態になる。
// GAS の doPost(e) はリクエストヘッダー（Referer/Origin）もクライアントIPも受け取れないため、
// GAS側でのリファラー制限は実装不可（Apps Script Web Appの仕様上の制約）。
// そのため下記のトークンは、この一覧取得（読み取り専用）だけに使える低権限トークンを
// 事務所側のGASプロジェクトで別途発行したものを設定すること。他の書き込み系・管理系の
// 処理と同じトークンを共用しない（漏洩時の被害範囲を「このフィードが読めるだけ」に限定するため）。
// 将来的にオリジン制限や真の秘匿性が必要になった場合は、Cloudflare Workers等の軽量プロキシを
// 前段に挟む方式への切り替えを検討する（docs/Phase1/05参照）。
//
// なお HTML側の #subsidy-feed-list には、意味のある制度紹介文をあらかじめ静的に記載している
// （「現在取得中です」のようなプレースホルダーではない）。クローラーはJSレンダリングを待たずに
// 生のHTMLをまず読むため、この静的な内容が確実にインデックスされる。<noscript> に同内容を
// 書く方式は、JS実行環境（Googlebot含む）では読まれない可能性があるため採用していない。
// 取得成功時のみ、この静的一覧がAPIから取得した最新一覧に置き換わる（プログレッシブエンハンスメント）。
(function () {
    const listEl = document.getElementById('subsidy-feed-list');
    if (!listEl) return;

    const SUBSIDY_API = {
        URL: 'https://script.google.com/macros/s/AKfycby7WTtWx4TU2r6WUzcCColVCDiTzITFvFvSh6db6g2DOBnlV0rnQRx4xIe7hh7zNjpQ2A/exec',
        // この一覧取得専用の低権限（読み取り限定）トークンを設定すること。空文字のままだとAPI呼び出しをスキップし、静的フォールバックを表示する
        SECRET_TOKEN: 'b8809bb46e6b0122a1c3f629d4950d83'
    };

    if (!SUBSIDY_API.SECRET_TOKEN) return;

    function escapeHtml(str) {
        return String(str || '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function isSafeUrl(url) {
        return typeof url === 'string' && /^https?:\/\//i.test(url);
    }

    fetch(SUBSIDY_API.URL, {
        method: 'POST',
        redirect: 'follow',
        // Content-Type を text/plain にすることで、GASが対応していないCORSプリフライト（OPTIONS）を回避する
        // （doPost側は e.postData.contents を JSON.parse するため、実データはJSON文字列のままでよい）
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
            mode: 'all',
            regions: ['宮城県'],
            keywords: ['小規模事業者', 'AI導入'],
            token: SUBSIDY_API.SECRET_TOKEN,
            limit: 10
        })
    })
        .then(res => res.json())
        .then(json => {
            if (!json || json.error || !Array.isArray(json.data)) {
                throw new Error((json && json.error) || 'invalid response');
            }
            const items = json.data.filter(item => item && item.title).slice(0, 7);
            if (items.length === 0) return;

            listEl.innerHTML = items.map(item => `
                <li class="subsidy-feed__item">
                    <div class="subsidy-feed__name">${escapeHtml(item.title)}</div>
                    ${item.summary ? `<div class="subsidy-feed__support" title="${escapeHtml(item.summary)}">${escapeHtml(item.summary)}</div>` : ''}
                    ${item.source ? `<div class="subsidy-feed__source">出典：${escapeHtml(item.source)}</div>` : ''}
                    ${isSafeUrl(item.url) ? `<a href="${escapeHtml(item.url)}" class="subsidy-feed__link" target="_blank" rel="noopener">公式サイトで詳細を見る</a>` : ''}
                </li>
            `).join('');
        })
        .catch(err => {
            // 取得に失敗した場合は、HTMLに静的記述された既定の制度一覧（SEO用フォールバック）をそのまま表示する
            console.warn('補助金フィードの動的取得に失敗したため、既定の内容を表示しています。', err);
        });
})();

// ===== toC「相続でやることガイド」（/guide/）: 設問に応じたチェックリストの出し分け =====
// 各フェーズの設問（ボタン式・単一選択／チェックボックス式・複数選択可）が、
// data-guide-show / data-guide-hide に指定したidの要素（チェックリスト項目や結果ボックス）の
// 表示・非表示を切り替える汎用の仕組み。ページ側は要素にidを振り、設問側に属性を指定するだけでよい。
(function () {
    const root = document.getElementById('guide-flow');
    if (!root) return;

    function applyToggle(idsAttr, hide) {
        if (!idsAttr) return;
        idsAttr.split(',').map(s => s.trim()).filter(Boolean).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('is-hidden', hide);
        });
    }

    // ボタン式の設問（グループ内は単一選択。はい／いいえ／わからない、3択等に対応）
    root.querySelectorAll('[data-guide-option]').forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.dataset.guideGroup;
            if (group) {
                root.querySelectorAll(`[data-guide-option][data-guide-group="${group}"]`).forEach(b => {
                    b.classList.remove('is-selected');
                });
            }
            btn.classList.add('is-selected');
            applyToggle(btn.dataset.guideShow, false);
            applyToggle(btn.dataset.guideHide, true);
        });
    });

    // チェックボックス式の設問（複数選択可。1つのチェックボックスが1つの項目の表示に対応する場合）
    root.querySelectorAll('[data-guide-check]').forEach(chk => {
        chk.addEventListener('change', () => {
            applyToggle(chk.dataset.guideShow, !chk.checked);
        });
    });

    // フェーズ3：準確定申告の要否（複数のチェックボックスのいずれか1つでも該当すれば表示、という
    // OR判定が必要なため、1:1で表示を切り替える上記の汎用処理とは別に個別実装する）
    const p3Checks = root.querySelectorAll('[data-guide-check-any="p3"]');
    const p3Result = document.getElementById('p3-result');
    if (p3Checks.length && p3Result) {
        const updateP3 = () => {
            const anyChecked = Array.from(p3Checks).some(c => c.checked);
            p3Result.classList.toggle('is-hidden', !anyChecked);
        };
        p3Checks.forEach(chk => chk.addEventListener('change', updateP3));
    }

    // フェーズ5：法定相続人の数から基礎控除額の目安を計算する（遺産総額は入力させず、
    // 計算後に「超えそうか」を3択で尋ねる形にすることで入力の手間を減らしている）
    const taxBtn = document.getElementById('guide-tax-submit');
    if (taxBtn) {
        taxBtn.addEventListener('click', () => {
            const heirsInput = document.getElementById('guide-tax-heirs');
            const resultEl = document.getElementById('guide-tax-result');
            const estateQuestion = document.getElementById('p5-estate-question');
            const heirs = parseInt(heirsInput.value, 10);

            if (!heirs || heirs < 1) {
                resultEl.innerHTML = '<p>法定相続人の数を入力してください。</p>';
                resultEl.classList.add('is-visible');
                estateQuestion?.classList.add('is-hidden');
                return;
            }

            const threshold = 3000 + 600 * heirs;
            resultEl.innerHTML = `<p>基礎控除額の目安：<strong>${threshold.toLocaleString()}万円</strong>（3,000万円＋600万円×${heirs}人）</p>`;
            resultEl.classList.add('is-visible');
            estateQuestion?.classList.remove('is-hidden');
        });
    }
})();

// ===== toC「相続でやることガイド」（/guide/）: フェーズウィザードのページ送り =====
// 5つのフェーズを1つずつ表示し、「次のフェーズへ」「前のフェーズへ」でページ送りする。
(function () {
    const wizard = document.getElementById('phase-wizard');
    if (!wizard) return;

    const cards = Array.from(wizard.querySelectorAll('.phase-card[data-phase]'));
    const total = cards.length;
    const stepLabel = document.getElementById('phase-wizard-step');
    const barFill = document.getElementById('phase-wizard-bar-fill');
    const prevBtn = document.getElementById('phase-prev');
    const nextBtn = document.getElementById('phase-next');
    const doneNote = document.getElementById('phase-wizard-done');
    let current = 1;

    function render() {
        cards.forEach(card => {
            card.classList.toggle('is-hidden', Number(card.dataset.phase) !== current);
        });
        if (stepLabel) stepLabel.textContent = `フェーズ ${current} / ${total}`;
        if (barFill) barFill.style.width = (current / total * 100) + '%';
        if (prevBtn) prevBtn.disabled = current === 1;
        if (nextBtn) nextBtn.classList.toggle('is-hidden', current === total);
        if (doneNote) doneNote.classList.toggle('is-hidden', current !== total);
    }

    prevBtn?.addEventListener('click', () => {
        if (current > 1) {
            current -= 1;
            render();
            wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    nextBtn?.addEventListener('click', () => {
        if (current < total) {
            current += 1;
            render();
            wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // 「相続手続きの全体像」の各フェーズをクリック／Enterキーで押下すると、
    // そのフェーズの質問へ直接移動する
    document.querySelectorAll('.phase-overview [data-goto-phase]').forEach(step => {
        const goTo = () => {
            const target = Number(step.dataset.gotoPhase);
            if (target >= 1 && target <= total) {
                current = target;
                render();
                wizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
        step.addEventListener('click', goTo);
        step.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                goTo();
            }
        });
    });

    render();
})();
