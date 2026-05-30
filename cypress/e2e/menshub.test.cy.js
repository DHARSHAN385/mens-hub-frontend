describe('Men\'s Hub Comprehensive E2E Test', () => {
  beforeEach(() => {
    // Visit the app and clear local storage to start fresh
    cy.visit('http://localhost:5173/');
    cy.clearLocalStorage();
  });
  it('should navigate through the entire store, add items to cart, and place an order', () => {
    // 1. Homepage Verification
    cy.contains(/Men's Hub/i).should('be.visible');
    
    // Wait for products to load
    cy.get('.grid').should('be.visible');

    // 2. Browse Categories
    // Click "Category" in bottom nav or top nav
    cy.contains('Category').click({ force: true });
    
    // Check for "All Categories" title (using regex for case-insensitivity)
    cy.contains(/All Categories/i, { timeout: 10000 }).should('be.visible');
    
    // Click on the first category tile
    cy.get('.grid').find('button').first().click();

    // 3. Select a Product
    // We expect to be on a listing page now. Click the first product.
    cy.get('.grid').find('img').first().click({ force: true });
    
    // 4. Add to Cart
    // Wait for product details to show
    cy.contains(/ADD TO CART/i, { timeout: 10000 }).should('be.visible').click();
    cy.contains(/Added to cart/i).should('be.visible');
    
    // 5. Navigate to Cart
    cy.get('[data-cy="cart-btn"]').click();
    cy.contains(/Cart/i).should('be.visible');

    // 6. Proceed to Checkout
    cy.get('[data-cy="checkout-btn"]').click();
    
    // Will be redirected to login because we need auth
    cy.contains(/Login|Register/i).should('be.visible');
    
    // Perform Real Registration
    cy.contains(/Register/i).click();
    cy.get('input[type="text"]').type('Cypress User');
    cy.get('input[type="email"]').type(`cypress${Date.now()}@example.com`);
    
    // First password field
    cy.get('input[type="password"]').first().type('password123');
    // Confirm password field
    cy.get('input[type="password"]').last().type('password123');
    // Phone
    cy.get('input[type="tel"]').type('9876543210');
    
    cy.get('button[type="submit"]').contains(/Create Account/i).click();
    
    // Wait for successful login toast/redirect back to checkout or home
    cy.wait(2000);
    // Since we were trying to checkout, we might need to go to cart again if it redirected to home,
    // or if it goes to checkout, we just check for checkout.
    cy.get('[data-cy="cart-btn"]').click();
    cy.get('[data-cy="checkout-btn"]').click();
    cy.contains(/Checkout/i).should('be.visible');

    // 7. Fill Shipping Details (Step 0)
    cy.get('[data-cy="name-input"]').clear().type('Dharshan M');
    cy.get('[data-cy="email-input"]').clear().type('dharshan@example.com');
    cy.get('[data-cy="phone-input"]').clear().type('9876543210');
    cy.get('[data-cy="address-input"]').clear().type('123 Test Street, Mahalipatti');
    cy.get('[data-cy="city-input"]').clear().type('Madurai');
    cy.get('[data-cy="pincode-input"]').clear().type('625001');
    
    cy.get('[data-cy="next-step-btn"]').click();

    // 8. UPI Payment (Step 1)
    cy.contains(/UPI QR/i).should('be.visible');
    cy.contains(/Confirm UPI Payment/i).click();
    cy.contains(/Payment confirmed/i).should('be.visible');

    // 9. Review & Place Order (Step 2)
    cy.contains(/Shipping to/i).should('be.visible');
    
    // Allow actual order creation to reflect in database

    cy.get('[data-cy="place-order-btn"]').click();
    
    // 10. Success Screen
    cy.contains(/Order Placed/i, { timeout: 10000 }).should('be.visible');
  });

  it('should be able to search for products', () => {
    cy.contains('Search...').click({ force: true });
    // Just typing a generic letter to test search functionality
    cy.get('input[placeholder*="Search"]').type('a');
    cy.get('.fixed').should('be.visible');
  });
});