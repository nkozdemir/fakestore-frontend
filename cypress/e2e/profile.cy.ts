import {
  AUTH_STORAGE_KEY,
  escapeRegExp,
  getApiBaseUrl,
  stubCatalogRoutes,
} from "../support/api-helpers"

const TOKENS = {
  access: "profile-access-token",
  refresh: "profile-refresh-token",
}

type AuthScenario = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  last_login: string | null
  date_joined: string
  is_staff: boolean
  is_superuser: boolean
}

type Address = {
  id: number
  street: string
  number: number
  city: string
  zipcode: string
  latitude: string
  longitude: string
}

type ProfileScenario = {
  id: number
  email: string
  username: string
  phone?: string
  addresses: Address[]
  name: {
    first_name: string
    last_name: string
  }
}

type ScenarioState = {
  auth: AuthScenario
  profile: ProfileScenario
  nextAddressId: number
}

const createProfileScenario = (): ScenarioState => ({
  auth: {
    id: 1,
    username: "john",
    email: "john@example.com",
    first_name: "John",
    last_name: "Doe",
    last_login: "2024-11-07T09:30:00Z",
    date_joined: "2024-01-05T08:00:00Z",
    is_staff: false,
    is_superuser: false,
  },
  profile: {
    id: 1,
    email: "john@example.com",
    username: "john",
    phone: "+1 555 123 4567",
    addresses: [
      {
        id: 10,
        street: "Market Street",
        number: 123,
        city: "San Francisco",
        zipcode: "94103",
        latitude: "37.7749",
        longitude: "-122.4194",
      },
      {
        id: 11,
        street: "Mission Street",
        number: 456,
        city: "San Francisco",
        zipcode: "94110",
        latitude: "37.7599",
        longitude: "-122.4148",
      },
    ],
    name: {
      first_name: "John",
      last_name: "Doe",
    },
  },
  nextAddressId: 100,
})

type JsonRecord = Record<string, unknown>

const parseBody = (body: unknown): JsonRecord => {
  if (!body) {
    return {}
  }

  if (typeof body === "string") {
    try {
      return JSON.parse(body)
    } catch (error) {
      console.warn("Failed to parse request body", error)
      return {}
    }
  }

  if (typeof body === "object") {
    return body as JsonRecord
  }

  return {}
}

const toStringValue = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback

const toNumberValue = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && !isNaN(value)) {
    return value
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? fallback : parsed
  }

  return fallback
}

const extractGeo = (value: unknown) => {
  if (value && typeof value === "object") {
    const record = value as JsonRecord
    return {
      lat: toStringValue(record.lat, ""),
      long: toStringValue(record.long, ""),
    }
  }

  return { lat: "", long: "" }
}

const setupProfileInterceptors = (scenario: ScenarioState) => {
  const apiBaseUrl = getApiBaseUrl()
  const userUrl = `${apiBaseUrl}users/${scenario.auth.id}/`
  const addressesUrl = `${apiBaseUrl}users/${scenario.auth.id}/addresses/`
  const addressDetailPattern = new RegExp(`^${escapeRegExp(apiBaseUrl)}users/addresses/(\\d+)/`)

  cy.intercept("GET", `${apiBaseUrl}auth/me/`, (req) => {
    req.reply(scenario.auth)
  }).as("authMe")

  cy.intercept("GET", userUrl, (req) => {
    req.reply(scenario.profile)
  }).as("userProfile")

  cy.intercept("PATCH", userUrl, (req) => {
    const body = parseBody(req.body)

    if ("password" in body) {
      req.alias = "changePassword"
      req.reply({ success: true })
      return
    }

    req.alias = "updateProfile"

    if (typeof body.first_name === "string") {
      scenario.auth.first_name = body.first_name
      scenario.profile.name.first_name = body.first_name
    }

    if (typeof body.last_name === "string") {
      scenario.auth.last_name = body.last_name
      scenario.profile.name.last_name = body.last_name
    }

    if (typeof body.email === "string") {
      scenario.auth.email = body.email
      scenario.profile.email = body.email
    }

    if (typeof body.username === "string") {
      scenario.auth.username = body.username
      scenario.profile.username = body.username
    }

    if (typeof body.phone === "string") {
      scenario.profile.phone = body.phone
    }

    req.reply({ success: true })
  })

  cy.intercept("POST", addressesUrl, (req) => {
    req.alias = "createAddress"
    const body = parseBody(req.body)
    const geolocation = extractGeo(body.geolocation)
    const newAddress: Address = {
      id: scenario.nextAddressId++,
      street: toStringValue(body.street),
      number: toNumberValue(body.number),
      city: toStringValue(body.city),
      zipcode: toStringValue(body.zipcode),
      latitude: geolocation.lat,
      longitude: geolocation.long,
    }
    scenario.profile.addresses.push(newAddress)
    req.reply(newAddress)
  })

  cy.intercept("PATCH", addressDetailPattern, (req) => {
    req.alias = "updateAddress"
    const body = parseBody(req.body)
    const match = req.url.match(/users\/addresses\/(\d+)\//)
    const addressId = match ? parseInt(match[1], 10) : null
    if (!addressId) {
      req.reply({ statusCode: 400 })
      return
    }
    let targetIndex = -1
    for (let index = 0; index < scenario.profile.addresses.length; index++) {
      if (scenario.profile.addresses[index].id === addressId) {
        targetIndex = index
        break
      }
    }
    if (targetIndex === -1) {
      req.reply({ statusCode: 404 })
      return
    }
    const geolocation = extractGeo(body.geolocation)
    const currentAddress = scenario.profile.addresses[targetIndex]
    scenario.profile.addresses[targetIndex] = {
      ...currentAddress,
      street: toStringValue(body.street, currentAddress.street),
      number: toNumberValue(body.number, currentAddress.number),
      city: toStringValue(body.city, currentAddress.city),
      zipcode: toStringValue(body.zipcode, currentAddress.zipcode),
      latitude: geolocation.lat || currentAddress.latitude,
      longitude: geolocation.long || currentAddress.longitude,
    }

    req.reply(scenario.profile.addresses[targetIndex])
  })

  cy.intercept("DELETE", addressDetailPattern, (req) => {
    req.alias = "deleteAddress"
    const match = req.url.match(/users\/addresses\/(\d+)\//)
    const addressId = match ? parseInt(match[1], 10) : null
    if (!addressId) {
      req.reply({ statusCode: 400 })
      return
    }
    scenario.profile.addresses = scenario.profile.addresses.filter(
      (address) => address.id !== addressId,
    )
    req.reply({ statusCode: 204 })
  })

  cy.intercept("DELETE", userUrl, (req) => {
    req.alias = "deleteAccount"
    req.reply({ statusCode: 204 })
  })

  cy.intercept("POST", `${apiBaseUrl}auth/logout/`, (req) => {
    req.alias = "logoutRequest"
    req.reply({ statusCode: 204 })
  })
}

const visitProfile = () =>
  cy.visit("/profile", {
    onBeforeLoad(win) {
      win.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(TOKENS))
    },
  })

describe("Profile management", () => {
  beforeEach(() => {
    stubCatalogRoutes()
    const scenario = createProfileScenario()
    setupProfileInterceptors(scenario)
    cy.wrap(scenario).as("scenario")
    visitProfile()
    cy.wait("@authMe")
    cy.wait("@userProfile")
  })

  it("updates profile information", () => {
    cy.get('[data-testid="edit-profile-button"]').click()
    cy.get('[data-testid="profile-form"]').within(() => {
      cy.get("#firstName").clear().type("Johnathan")
      cy.get("#lastName").clear().type("Carter")
      cy.get("#email").clear().type("johnathan@example.com")
      cy.get("#phone").clear().type("+1 555 777 8888")
      cy.get("#username").clear().type("johnny")
      cy.get('[data-testid="profile-save"]').click()
    })

    cy.wait("@updateProfile")
    cy.wait("@authMe")
    cy.wait("@userProfile")

    cy.contains("Johnathan Carter").should("be.visible")
    cy.contains("johnathan@example.com").should("be.visible")
    cy.contains("+1 555 777 8888").should("be.visible")
    cy.contains("Username: johnny").should("be.visible")
  })

  it("changes the account password", () => {
    cy.get('[data-testid="change-password-button"]').click()
    cy.get('[data-testid="password-form"]').within(() => {
      cy.get("#new-password").type("Supersafe123!")
      cy.get("#confirm-password").type("Supersafe123!")
      cy.get('[data-testid="password-save"]').click()
    })
    cy.wait("@changePassword")
    cy.get('[data-testid="password-form"]').should("not.exist")
  })

  it("adds, edits, and deletes an address", () => {
    cy.get('[data-testid="add-address-button"]').click()
    cy.get('[data-testid="address-form"]').within(() => {
      cy.get("#street").type("Harbor Blvd")
      cy.get("#number").type("99")
      cy.get("#city").type("Los Angeles")
      cy.get("#zipcode").type("90001")
      cy.get("#latitude").type("34.0522")
      cy.get("#longitude").type("-118.2437")
      cy.get('[data-testid="address-save"]').click()
    })

    cy.wait("@createAddress").its("response.body.id").as("createdAddressId")
    cy.wait("@userProfile")

    cy.contains("Harbor Blvd 99").should("be.visible")
    cy.contains("Los Angeles, 90001").should("be.visible")

    cy.get("@createdAddressId").then((id) => {
      cy.get(`[data-testid="edit-address-button"][data-address-id="${id}"]`).click()
      cy.get('[data-testid="address-form"]').within(() => {
        cy.get("#city").clear().type("Seattle")
        cy.get("#zipcode").clear().type("98101")
        cy.get('[data-testid="address-save"]').click()
      })
      cy.wait("@updateAddress")
      cy.wait("@userProfile")
      cy.contains("Seattle, 98101").should("be.visible")

      cy.get(`[data-testid="delete-address-button"][data-address-id="${id}"]`).click()
      cy.get('[data-testid="confirm-delete-address"]').click()
      cy.wait("@deleteAddress")
      cy.wait("@userProfile")
      cy.contains("Harbor Blvd 99").should("not.exist")
    })
  })

  it("deletes the account", () => {
    cy.get('[data-testid="delete-account-trigger"]').click()
    cy.get('[data-testid="confirm-delete-account"]').click()
    cy.wait("@deleteAccount")
    cy.wait("@logoutRequest")
    cy.location("pathname").should("eq", "/login")
  })
})
