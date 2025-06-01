# TODO: Future Enhancements

## 🤖 On-Device AI Processing

- [ ] Replace/supplement cloud AI services with on-device models to enable:
  - **Offline mode** functionality
  - **PWA (Progressive Web App)** capabilities
  - **Enhanced privacy** - no sensitive financial data leaves the device
  - **Cost reduction** - no API calls to external services

### Recommended Models:

- **DeepSeek** - Efficient model for code and document understanding
- **Llama 2/3** - Open source models that can run locally
- **ONNX models** - Optimized for browser/edge deployment
- **TensorFlow.js models** - Run directly in the browser

### Implementation Ideas:

1. Use WebAssembly for better performance
2. Implement model caching for faster subsequent loads
3. Add fallback to cloud services when local processing fails
4. Create a model selection UI for users to choose processing method

## 🏦 Additional Account Types Support

### Mortgage Accounts

- [ ] Add mortgage account type to the schema
- [ ] Create specialized parsers for mortgage statements
- [ ] Implement mortgage-specific metrics:
  - Principal vs Interest breakdown
  - Remaining balance tracking
  - Amortization schedule visualization
  - Payment history analysis
  - Escrow account tracking

### Loan Accounts

- [ ] Support personal loans
- [ ] Support auto loans
- [ ] Support student loans
- [ ] Implement loan-specific features:
  - Loan term tracking
  - Interest rate monitoring
  - Early payoff calculators
  - Payment schedule management
  - Refinancing analysis tools

### UI/UX Enhancements Needed:

- [ ] New account type selection in card creation
- [ ] Specialized dashboards for different account types
- [ ] Custom analytics views for loans/mortgages
- [ ] Payment reminder system
- [ ] Goal tracking (e.g., "Pay off loan by X date")

## 📝 Implementation Notes:

### For On-Device AI:

1. Research model size vs accuracy tradeoffs
2. Implement progressive enhancement (cloud → local fallback)
3. Add user settings for processing preferences
4. Monitor device performance and adjust accordingly

### For New Account Types:

1. Extend the database schema with account-specific fields
2. Create new processing pipelines for different statement formats
3. Design account-type-specific UI components
4. Add new analytics calculations for loan/mortgage metrics

## 🎯 Priority Order:

1. Implement basic on-device AI for credit card statements
2. Add mortgage account support (high user value)
3. Expand to other loan types
4. Optimize on-device processing performance
5. Create comprehensive offline mode

---

_Created on: January 2025_  
_Last Updated: January 2025_
