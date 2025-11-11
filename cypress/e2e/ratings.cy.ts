import {
  escapeRegExp,
  getApiBaseUrl,
  stubAuthSuccess,
  stubCatalogRoutes,
} from "../support/api-helpers"

const forms = {
  login: '[data-testid="login-form"]',
}

const productId = 6
const selectors = {
  ratingMessage: '[data-testid="user-rating-message"]',
  removeButton: '[data-testid="remove-rating"]',
  star: (value: number) => `[data-testid="rate-star-${value}"]`,
}

const createRatingsScenario = () => {
  const baseRatings = [
    {
      id: 1001,
      firstName: "Mia",
      lastName: "Lewis",
      value: 5,
      createdAt: "2024-10-01T12:00:00Z",
      updatedAt: "2024-10-01T12:00:00Z",
    },
    {
      id: 1002,
      firstName: "Leo",
      lastName: "Stone",
      value: 1,
      createdAt: "2024-10-02T12:00:00Z",
      updatedAt: "2024-10-02T12:00:00Z",
    },
  ]

  const userRatingEntry = {
    id: 2001,
    firstName: "John",
    lastName: "Doe",
    value: 4,
    createdAt: "2024-11-10T10:00:00Z",
    updatedAt: "2024-11-10T10:00:00Z",
  }

  const initialSummary = {
    productId,
    rating: {
      rate: 3,
      count: 2,
    },
    userRating: null,
  }

  const summaryWithRating = {
    productId,
    rating: {
      rate: Number(((5 + 1 + userRatingEntry.value) / 3).toFixed(2)),
      count: 3,
    },
    userRating: userRatingEntry.id,
  }

  const summaryAfterRemoval = {
    ...initialSummary,
  }

  const listInitial = {
    productId,
    count: baseRatings.length,
    ratings: baseRatings,
  }

  const listWithUser = {
    productId,
    count: baseRatings.length + 1,
    ratings: [userRatingEntry, ...baseRatings],
  }

  return {
    userRatingEntry,
    states: {
      summary: initialSummary,
      ratings: listInitial,
    },
    summaryWithRating,
    summaryAfterRemoval,
    listWithUser,
    listInitial,
  }
}

const setupProductDetailNetwork = () => {
  const apiBaseUrl = getApiBaseUrl()
  const scenario = createRatingsScenario()
  const productUrl = `${apiBaseUrl}products/${productId}/`
  const ratingUrl = `${apiBaseUrl}products/${productId}/rating/`
  const ratingsListUrl = `${apiBaseUrl}products/${productId}/ratings/`
  const ratingUrlRegex = new RegExp(`^${escapeRegExp(ratingUrl)}.*`)

  cy.intercept("GET", productUrl, { fixture: "products/product-6.json" }).as("getProduct")

  cy.intercept("GET", ratingUrl, (req) => {
    req.reply(scenario.states.summary)
  }).as("getRatingSummary")

  cy.intercept("GET", ratingsListUrl, (req) => {
    req.reply(scenario.states.ratings)
  }).as("getRatingsList")

  cy.intercept("POST", ratingUrl, (req) => {
    expect(req.body, "rating payload").to.deep.equal({
      value: scenario.userRatingEntry.value,
    })
    scenario.states.summary = scenario.summaryWithRating
    scenario.states.ratings = scenario.listWithUser
    req.reply(scenario.summaryWithRating)
  }).as("postRating")

  cy.intercept("DELETE", ratingUrlRegex, (req) => {
    const ratingId =
      req.query?.ratingId ?? new URL(req.url).searchParams.get("ratingId")

    expect(ratingId, "rating id provided when deleting").to.equal(
      String(scenario.userRatingEntry.id),
    )

    scenario.states.summary = scenario.summaryAfterRemoval
    scenario.states.ratings = scenario.listInitial
    req.reply(scenario.summaryAfterRemoval)
  }).as("deleteRating")
}

describe("Product ratings", () => {
  beforeEach(() => {
    stubCatalogRoutes()
    stubAuthSuccess()
  })

  it("lets an authenticated shopper rate and unrate a product", () => {
    setupProductDetailNetwork()

    cy.visit("/login")

    cy.get(forms.login).within(() => {
      cy.get('input[name="username"]').type("john")
      cy.get('input[name="password"]').type("Password123!")
      cy.get('[data-testid="login-submit"]').click()
    })

    cy.wait("@loginRequest")
    cy.wait("@authMe")
    cy.wait("@userProfile")
    cy.wait("@getCategories")
    cy.wait("@getProducts")

    cy.visit(`/products/${productId}`)

    cy.wait("@getProduct")
    cy.wait("@getRatingSummary")
    cy.wait("@getRatingsList")

    cy.contains(selectors.ratingMessage, "Select a star rating.").should("be.visible")

    cy.get(selectors.star(4)).click()

    cy.wait("@postRating")
    cy.wait("@getRatingsList").its("response.body.count").should("eq", 3)

    cy.contains(selectors.ratingMessage, "You rated this product").should("be.visible")
    cy.get(selectors.removeButton).should("be.visible")

    cy.get(selectors.removeButton).click()

    cy.wait("@deleteRating")
    cy.wait("@getRatingsList").its("response.body.count").should("eq", 2)

    cy.contains(selectors.ratingMessage, "Select a star rating.").should("be.visible")
    cy.get(selectors.removeButton).should("not.exist")
  })
})
