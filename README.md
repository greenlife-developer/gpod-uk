openapi: 3.0.0
info:
  title: HMRC VAT API Integration
  version: 1.0.0
  description: An Express backend that handles HMRC OAuth authentication, retrieves VAT obligations, and submits VAT returns using the HMRC test environment.

servers:
  - url: http://localhost:5000
    description: Local development server

paths:
  /api/oauth/login:
    get:
      summary: Redirect to HMRC OAuth Login
      description: Redirects the user to HMRC's OAuth 2.0 consent screen.
      parameters:
        - in: query
          name: redirectTo
          schema:
            type: string
          description: Optional URL to redirect to after login.
      responses:
        '302':
          description: Redirect to HMRC authorization URL

  /api/oauth/callback:
    get:
      summary: OAuth Callback
      description: Handles the callback from HMRC and exchanges the code for an access token.
      parameters:
        - in: query
          name: code
          required: true
          schema:
            type: string
          description: The authorization code returned by HMRC.
      responses:
        '302':
          description: Redirect after successful login
        '500':
          description: Failed to exchange code for token

  /api/vat-obligations/{vrn}:
    get:
      summary: Get VAT Obligations
      description: Retrieves VAT obligations for a given VRN within a date range.
      parameters:
        - in: path
          name: vrn
          required: true
          schema:
            type: string
          description: VAT Registration Number
        - in: query
          name: from
          schema:
            type: string
            format: date
          description: Start date (YYYY-MM-DD)
        - in: query
          name: to
          schema:
            type: string
            format: date
          description: End date (YYYY-MM-DD)
        - in: query
          name: status
          schema:
            type: string
          description: Obligation status (e.g., O, F, etc.)
      responses:
        '200':
          description: VAT obligations returned
        '500':
          description: Failed to fetch VAT obligations

  /api/vat-return/{vrn}:
    post:
      summary: Submit VAT Return
      description: Submits a VAT return for a given VRN.
      parameters:
        - in: path
          name: vrn
          required: true
          schema:
            type: string
          description: VAT Registration Number
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                periodKey:
                  type: string
                vatDueSales:
                  type: string
                vatDueAcquisitions:
                  type: string
                totalVatDue:
                  type: string
                vatReclaimedCurrPeriod:
                  type: string
                netVatDue:
                  type: string
                totalValueSalesExVAT:
                  type: integer
                totalValuePurchasesExVAT:
                  type: integer
                totalValueGoodsSuppliedExVAT:
                  type: integer
                totalAcquisitionsExVAT:
                  type: integer
                finalised:
                  type: boolean
              required:
                - periodKey
                - vatDueSales
                - vatDueAcquisitions
                - totalVatDue
                - vatReclaimedCurrPeriod
                - netVatDue
                - totalValueSalesExVAT
                - totalValuePurchasesExVAT
                - totalValueGoodsSuppliedExVAT
                - totalAcquisitionsExVAT
                - finalised
      responses:
        '200':
          description: VAT return successfully submitted
        '500':
          description: Failed to submit VAT return
