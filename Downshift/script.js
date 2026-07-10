let products = [];
let filteredProducts = [];
let productsPerPage = 16;
let currentPage = 1;
let currentSearchQuery = '';
let currentCategory = 'All';

async function loadProducts() {
    try {
        const response = await fetch("items.json");

        if (!response.ok) {
            throw new Error("Failed to load products.");
        }

        const data = await response.json();

        products = data.map(product => ({
            ...product,
            title: (product.title ?? '').trim(),
            brand: (product.brand ?? '').trim(),
            category: (product.category ?? '').trim(),
            description: (product.description ?? '').trim(),
            price: Number(product.price),
            rating: Number(product.rating),
            reviews: Number(product.reviews),
            image: product.image || "",
            tags: Array.isArray(product.tags) ? product.tags : [],
            inStock: Boolean(product.inStock)
        }));

        filteredProducts = [...products];

        renderProducts();

        initializeSearch();
        initializeCategoryFilters();
        initializeSorting();
        initializePageSize();

    } catch (error) {
        console.error(error);
    }
}

function createProductCard(product) {
    return `
        <article class="product-card">
            <div class="product-image">
                <img
                    src="${product.image}"
                    alt="${product.title}"
                    loading="lazy"
                    onerror="this.onerror=null; this.src='assets/banner.png';"
                >
                <button class="favorite-btn" aria-label="Save product">♡</button>
            </div>

            <div class="product-content">
                <span class="product-category">${product.category.toUpperCase()}</span>

                <h3 class="product-title">${product.title}</h3>

                <p class="product-brand">📦 ${product.brand}</p>

                <p class="product-rating">⭐ ${product.rating.toFixed(1)} (${product.reviews})</p>

                <div class="product-footer">
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                    <span class="stock-status">
                        ${product.inStock ? '● In Stock' : '● Out of Stock'}
                    </span>
                </div>
            </div>
        </article>
    `;
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;

    const visibleProducts = filteredProducts.slice(start, end);

    grid.innerHTML = visibleProducts
        .map(createProductCard)
        .join('');

    document.getElementById('results-count').innerHTML =
        `<strong>${filteredProducts.length.toLocaleString()}</strong> products available`;

    renderPagination();
}

function renderPagination() {
    let pagination = document.getElementById('pagination');

    if (!pagination) {
        pagination = document.createElement('div');
        pagination.id = 'pagination';
        pagination.className = 'pagination';
        document.querySelector('.catalog .container').appendChild(pagination);
    }

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const maxVisiblePages = 6;

    pagination.innerHTML = '';

    const prevButton = document.createElement('button');
    prevButton.className = 'arrow';
    prevButton.innerHTML = '&lsaquo;';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
            window.scrollTo({
                top: document.querySelector('.catalog').offsetTop - 40,
                behavior: 'smooth'
            });
        }
    });
    pagination.appendChild(prevButton);

    const pageGroup = Math.floor((currentPage - 1) / maxVisiblePages);
    const startPage = pageGroup * maxVisiblePages + 1;
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    for (let page = startPage; page <= endPage; page++) {
        const button = document.createElement('button');
        button.textContent = page;

        if (page === currentPage) {
            button.classList.add('active');
        }

        button.addEventListener('click', () => {
            currentPage = page;
            renderProducts();
            window.scrollTo({
                top: document.querySelector('.catalog').offsetTop - 40,
                behavior: 'smooth'
            });
        });

        pagination.appendChild(button);
    }

    const nextButton = document.createElement('button');
    nextButton.className = 'arrow';
    nextButton.innerHTML = '&rsaquo;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts();
            window.scrollTo({
                top: document.querySelector('.catalog').offsetTop - 40,
                behavior: 'smooth'
            });
        }
    });
    pagination.appendChild(nextButton);
}

function initializeSearch() {
    const searchInput = document.getElementById('search');

    if (!searchInput) return;

    searchInput.addEventListener('input', (event) => {
        currentSearchQuery = event.target.value.trim().toLowerCase();
        currentPage = 1;
        applyFilters();
    });
}

function applyFilters() {
    filteredProducts = products.filter(product => {
        const matchesCategory =
            currentCategory === 'All' || product.category === currentCategory;

        const searchableText = [
            product.title,
            product.brand,
            product.category,
            product.description,
            ...(product.tags || [])
        ].join(' ').toLowerCase();

        const matchesSearch =
            !currentSearchQuery || searchableText.includes(currentSearchQuery);

        return matchesCategory && matchesSearch;
    });

    currentPage = 1;
    renderProducts();
}

function initializeCategoryFilters() {
    const buttons = document.querySelectorAll('#category-filters button');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            currentCategory = button.textContent.trim();
            applyFilters();
        });
    });
}

function initializeSorting() {
    const sortSelect = document.getElementById('sort');

    if (!sortSelect) return;

    sortSelect.addEventListener('change', () => {
        switch (sortSelect.value) {
            case 'price-low':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;

            case 'price-high':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;

            case 'rating':
                filteredProducts.sort((a, b) => b.rating - a.rating);
                break;

            case 'relevance':
            default:
                if (!currentSearchQuery) {
                    filteredProducts = [...products];
                } else {
                    filteredProducts = products.filter(product => {
                        const searchableText = [
                            product.title,
                            product.brand,
                            product.category,
                            product.description,
                            ...(product.tags || [])
                        ].join(' ').toLowerCase();

                        return searchableText.includes(currentSearchQuery);
                    });
                }
                break;
        }

        currentPage = 1;
        renderProducts();
    });
}

function initializePageSize() {
    const pageSizeSelect = document.getElementById('page-size');

    if (!pageSizeSelect) return;

    pageSizeSelect.value = productsPerPage;

    pageSizeSelect.addEventListener('change', (event) => {
        productsPerPage = Number(event.target.value);
        currentPage = 1;
        renderProducts();
    });
}

loadProducts();