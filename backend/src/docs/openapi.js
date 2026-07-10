const authSecurity = [{ bearerAuth: [] }, { cookieAuth: [] }];

const json = (schema, example) => ({
  content: {
    "application/json": {
      schema,
      ...(example ? { example } : {}),
    },
  },
});

const response = (description, schema, example) => ({
  description,
  ...(schema ? json(schema, example) : {}),
});

const success = (dataProperties = {}, description = "Successful response") =>
  response(description, {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", example: "success" },
      ...dataProperties,
    },
  });

const error = (description) =>
  response(description, { $ref: "#/components/schemas/ErrorResponse" });

const requestBody = (schema, description, required = true) => ({
  required,
  ...(description ? { description } : {}),
  ...json(schema),
});

const idParameter = (name, description) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
  example: "507f1f77bcf86cd799439011",
});

const queryParameter = (name, description, schema) => ({
  name,
  in: "query",
  required: false,
  description,
  schema,
});

const operation = ({
  tag,
  summary,
  description,
  secured = false,
  parameters,
  body,
  responses,
}) => ({
  tags: [tag],
  summary,
  ...(description ? { description } : {}),
  ...(secured ? { security: authSecurity } : {}),
  ...(parameters ? { parameters } : {}),
  ...(body ? { requestBody: body } : {}),
  responses,
});

const userRef = { $ref: "#/components/schemas/User" };
const serviceRef = { $ref: "#/components/schemas/Service" };
const jobRequestRef = { $ref: "#/components/schemas/JobRequest" };
const paginationRef = { $ref: "#/components/schemas/Pagination" };

const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "SAN3A API",
    version: "1.0.0",
    description:
      "Interactive documentation for the SAN3A home-services backend. Protected endpoints accept either an Authorization: Bearer <JWT> header or the httpOnly jwt cookie returned by login/signup.",
  },
  servers: [
    {
      url: process.env.API_DOCS_SERVER_URL || "http://localhost:5000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "System", description: "Service health" },
    { name: "Authentication", description: "Account and password flows" },
    { name: "Users", description: "Profiles and public craftsmen" },
    { name: "Dashboards", description: "Role-specific dashboard data" },
    { name: "Services", description: "Service catalog" },
    { name: "Requests", description: "Service-request lifecycle" },
    { name: "Matching", description: "Nearby craftsmen and match scoring" },
    { name: "Admin", description: "Admin-only operations" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste the token returned by signup or login.",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "jwt",
        description: "httpOnly JWT cookie returned by signup or login.",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["status", "message"],
        properties: {
          status: { type: "string", enum: ["fail", "error"] },
          message: { type: "string" },
          error: { type: "string" },
        },
      },
      GeoLocation: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["Point"], default: "Point" },
          coordinates: {
            type: "array",
            minItems: 2,
            maxItems: 2,
            description: "GeoJSON order: [longitude, latitude]",
            items: { type: "number" },
            example: [31.2357, 30.0444],
          },
          address: { type: "string", example: "Downtown Cairo" },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "507f1f77bcf86cd799439011" },
          name: { type: "string", example: "Ahmed Hassan" },
          email: { type: "string", format: "email", example: "ahmed@example.com" },
          phone: { type: "string", example: "+201001234567" },
          role: { type: "string", enum: ["customer", "craftsman", "admin"] },
          avatar: { type: "string", example: "default.png" },
          location: { $ref: "#/components/schemas/GeoLocation" },
          isAvailable: { type: "boolean" },
          isActive: { type: "boolean" },
          rating: { type: "number", minimum: 1, maximum: 5, example: 4.5 },
          avgResponseTimeSeconds: { type: "number", nullable: true, example: 75 },
          responseCount: { type: "integer", minimum: 0 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Service: {
        type: "object",
        required: ["nameAr", "nameEn", "slug", "icon"],
        properties: {
          _id: { type: "string", example: "507f1f77bcf86cd799439012" },
          nameAr: { type: "string", example: "سباكة" },
          nameEn: { type: "string", example: "Plumbing" },
          slug: { type: "string", example: "plumbing" },
          icon: { type: "string", example: "wrench" },
          isActive: { type: "boolean", default: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Pricing: {
        type: "object",
        properties: {
          baseFee: { type: "number", example: 120 },
          emergencyFee: { type: "number", example: 30 },
          totalAmount: { type: "number", example: 150 },
        },
      },
      StatusHistoryItem: {
        type: "object",
        properties: {
          status: { $ref: "#/components/schemas/RequestStatus" },
          changedAt: { type: "string", format: "date-time" },
          note: { type: "string" },
        },
      },
      MatchingPoolEntry: {
        type: "object",
        properties: {
          craftsman: { type: "string" },
          offeredAt: { type: "string", format: "date-time" },
          respondedAt: { type: "string", format: "date-time", nullable: true },
          response: {
            type: "string",
            enum: ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"],
          },
        },
      },
      RequestStatus: {
        type: "string",
        enum: [
          "PENDING_MATCHING",
          "SELECTED",
          "PAID",
          "ACCEPTED",
          "ARRIVED",
          "IN_PROGRESS",
          "COMPLETED",
          "CANCELLED",
          "DISPUTED",
          "REFUNDED",
        ],
      },
      JobRequest: {
        type: "object",
        properties: {
          _id: { type: "string" },
          client: { oneOf: [{ type: "string" }, userRef] },
          craftsman: { oneOf: [{ type: "string" }, userRef], nullable: true },
          service: { oneOf: [{ type: "string" }, serviceRef] },
          status: { $ref: "#/components/schemas/RequestStatus" },
          statusHistory: {
            type: "array",
            items: { $ref: "#/components/schemas/StatusHistoryItem" },
          },
          matchingPool: {
            type: "array",
            items: { $ref: "#/components/schemas/MatchingPoolEntry" },
          },
          location: { $ref: "#/components/schemas/GeoLocation" },
          scheduledAt: { type: "string", format: "date-time" },
          clientNotes: { type: "string" },
          pricing: { $ref: "#/components/schemas/Pricing" },
          paymentMethod: {
            type: "string",
            enum: ["CASH", "CARD", "VODAFONE_CASH"],
          },
          isPaid: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          currentPage: { type: "integer", example: 1 },
          totalPages: { type: "integer", example: 3 },
          totalItems: { type: "integer", example: 27 },
        },
      },
      MatchResult: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          phone: { type: "string" },
          avatar: { type: "string" },
          rating: { type: "number" },
          distanceKm: { type: "number" },
          avgResponseTimeSeconds: { type: "number", nullable: true },
          completedWithClient: { type: "integer" },
          matchPercentage: { type: "integer", minimum: 0, maximum: 100 },
          breakdown: {
            type: "object",
            properties: {
              distance: { type: "integer" },
              rating: { type: "integer" },
              responseTime: { type: "integer" },
              history: { type: "integer" },
            },
          },
        },
      },
      SignupInput: {
        type: "object",
        required: ["name", "email", "phone", "password"],
        properties: {
          name: { type: "string", example: "Ahmed Hassan" },
          email: { type: "string", format: "email", example: "ahmed@example.com" },
          phone: { type: "string", example: "+201001234567" },
          password: { type: "string", format: "password", minLength: 8, example: "Password123" },
          role: { type: "string", enum: ["customer", "craftsman"], default: "customer" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "ahmed@example.com" },
          password: { type: "string", format: "password", example: "Password123" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          token: { type: "string", description: "JWT valid for 90 days" },
          data: {
            type: "object",
            properties: { user: userRef },
          },
        },
      },
      CreateRequestInput: {
        type: "object",
        required: ["service", "address", "coordinates"],
        properties: {
          service: { type: "string", example: "507f1f77bcf86cd799439012" },
          address: { type: "string", example: "12 Tahrir Street, Cairo" },
          coordinates: {
            type: "array",
            minItems: 2,
            maxItems: 2,
            items: { type: "number" },
            example: [31.2357, 30.0444],
          },
          clientNotes: { type: "string", example: "Water leaking under the sink" },
          paymentMethod: {
            type: "string",
            enum: ["CASH", "CARD", "VODAFONE_CASH"],
            default: "CASH",
          },
          scheduledAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/": {
      get: operation({
        tag: "System",
        summary: "Check backend health",
        responses: {
          200: {
            description: "Backend is running",
            content: { "text/plain": { schema: { type: "string" }, example: "server is working ...." } },
          },
        },
      }),
    },
    "/api/v1/users/signup": {
      post: operation({
        tag: "Authentication",
        summary: "Create an account",
        body: requestBody({ $ref: "#/components/schemas/SignupInput" }),
        responses: {
          201: response("Account created", { $ref: "#/components/schemas/AuthResponse" }),
          400: error("Validation or duplicate-field error"),
        },
      }),
    },
    "/api/v1/users/login": {
      post: operation({
        tag: "Authentication",
        summary: "Log in",
        body: requestBody({ $ref: "#/components/schemas/LoginInput" }),
        responses: {
          200: response("Authenticated", { $ref: "#/components/schemas/AuthResponse" }),
          400: error("Email or password is missing"),
          401: error("Invalid credentials"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/users/logout": {
      post: operation({
        tag: "Authentication",
        summary: "Log out and clear the authentication cookie",
        description: "Clears the httpOnly jwt cookie. Clients should also discard locally stored session data.",
        responses: {
          200: success({ message: { type: "string" } }, "Logged out"),
        },
      }),
    },
    "/api/v1/users/forgotPassword": {
      post: operation({
        tag: "Authentication",
        summary: "Send a password-reset email",
        body: requestBody({
          type: "object",
          required: ["email"],
          properties: { email: { type: "string", format: "email" } },
        }),
        responses: {
          200: success({ message: { type: "string" } }, "Reset email sent"),
          404: error("User not found"),
          500: error("Email delivery failed"),
        },
      }),
    },
    "/api/v1/users/resetPassword/{token}": {
      post: operation({
        tag: "Authentication",
        summary: "Reset a password",
        parameters: [{ name: "token", in: "path", required: true, schema: { type: "string" } }],
        body: requestBody({
          type: "object",
          required: ["password", "passwordConfirm"],
          properties: {
            password: { type: "string", format: "password", minLength: 8 },
            passwordConfirm: { type: "string", format: "password", minLength: 8 },
          },
        }),
        responses: {
          200: response("Password reset and user authenticated", { $ref: "#/components/schemas/AuthResponse" }),
          400: error("Reset token is invalid or expired"),
        },
      }),
    },
    "/api/v1/users/public/{id}": {
      get: operation({
        tag: "Users",
        summary: "Get a public user profile",
        parameters: [idParameter("id", "User ID")],
        responses: {
          200: success({
            data: {
              type: "object",
              properties: {
                user: userRef,
                stats: { type: "object", properties: { completedJobs: { type: "integer" } } },
              },
            },
          }),
          404: error("User not found"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/users/craftsmen": {
      get: operation({
        tag: "Users",
        summary: "List craftsmen",
        responses: {
          200: success({
            data: {
              type: "object",
              properties: { craftsmen: { type: "array", items: userRef } },
            },
          }),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/users/profile": {
      get: operation({
        tag: "Users",
        summary: "Get the authenticated user's profile",
        secured: true,
        responses: {
          200: success({ data: { type: "object", properties: { user: userRef } } }),
          401: error("Authentication required"),
        },
      }),
    },
    "/api/v1/users/update-profile": {
      patch: operation({
        tag: "Users",
        summary: "Update the authenticated user's profile",
        secured: true,
        body: requestBody({
          type: "object",
          properties: {
            name: { type: "string" },
            phone: { type: "string" },
            address: { type: "string" },
            avatar: { type: "string" },
          },
        }),
        responses: {
          200: success({ data: { type: "object", properties: { user: userRef } } }),
          400: error("Validation error"),
          401: error("Authentication required"),
        },
      }),
    },
    "/api/v1/users/dashboard/customer": {
      get: operation({
        tag: "Dashboards",
        summary: "Get the customer dashboard",
        description: "Allowed roles: customer, admin.",
        secured: true,
        responses: {
          200: success({ data: { type: "object", additionalProperties: true } }),
          401: error("Authentication required"),
          403: error("Customer or admin role required"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/users/dashboard/craftsman": {
      get: operation({
        tag: "Dashboards",
        summary: "Get the craftsman dashboard",
        description: "Allowed roles: craftsman, admin.",
        secured: true,
        responses: {
          200: success({ data: { type: "object", additionalProperties: true } }),
          401: error("Authentication required"),
          403: error("Craftsman or admin role required"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/users/admin-dashboard": {
      get: operation({
        tag: "Dashboards",
        summary: "Check admin dashboard access",
        description: "Allowed role: admin.",
        secured: true,
        responses: {
          200: success({ message: { type: "string" } }),
          401: error("Authentication required"),
          403: error("Admin role required"),
        },
      }),
    },
    "/api/v1/users/craftsman-orders": {
      get: operation({
        tag: "Dashboards",
        summary: "Check craftsman-order access",
        description: "Allowed roles: craftsman, admin.",
        secured: true,
        responses: {
          200: success({ message: { type: "string" } }),
          401: error("Authentication required"),
          403: error("Craftsman or admin role required"),
        },
      }),
    },
    "/api/v1/services": {
      get: operation({
        tag: "Services",
        summary: "List active services",
        responses: {
          200: success({
            results: { type: "integer" },
            data: { type: "object", properties: { services: { type: "array", items: serviceRef } } },
          }),
          500: error("Internal server error"),
        },
      }),
      post: operation({
        tag: "Services",
        summary: "Create a service",
        description: "This route is currently public in the Express router.",
        body: requestBody({
          type: "object",
          required: ["nameAr", "nameEn", "slug", "icon"],
          properties: {
            nameAr: { type: "string", example: "سباكة" },
            nameEn: { type: "string", example: "Plumbing" },
            slug: { type: "string", example: "plumbing" },
            icon: { type: "string", example: "wrench" },
            isActive: { type: "boolean", default: true },
          },
        }),
        responses: {
          201: success({ data: { type: "object", properties: { service: serviceRef } } }),
          400: error("Validation or duplicate-field error"),
        },
      }),
    },
    "/api/v1/requests": {
      post: operation({
        tag: "Requests",
        summary: "Create a service request",
        secured: true,
        body: requestBody({ $ref: "#/components/schemas/CreateRequestInput" }),
        responses: {
          201: success({ data: { type: "object", properties: { request: jobRequestRef } } }),
          400: error("Validation error"),
          401: error("Authentication required"),
        },
      }),
    },
    "/api/v1/requests/{id}": {
      get: operation({
        tag: "Requests",
        summary: "Get a service request",
        secured: true,
        parameters: [idParameter("id", "Request ID")],
        responses: {
          200: success({ data: { type: "object", properties: { request: jobRequestRef } } }),
          400: error("Invalid request ID"),
          401: error("Authentication required"),
          404: error("Request not found"),
        },
      }),
    },
    "/api/v1/requests/{requestId}/nearby-craftsmen": {
      get: operation({
        tag: "Matching",
        summary: "Find nearby available craftsmen",
        secured: true,
        parameters: [
          idParameter("requestId", "Request ID"),
          queryParameter("radius", "Search radius in meters; defaults to 5000", { type: "number", minimum: 1 }),
        ],
        responses: {
          200: success({
            results: { type: "integer" },
            data: { type: "object", properties: { craftsmen: { type: "array", items: userRef } } },
          }),
          400: error("Search failed"),
          401: error("Authentication required"),
          404: error("Request not found"),
        },
      }),
    },
    "/api/v1/requests/{requestId}/match-results": {
      get: operation({
        tag: "Matching",
        summary: "Get ranked craftsman matches",
        secured: true,
        parameters: [
          idParameter("requestId", "Request ID"),
          queryParameter("radius", "Search radius in meters; defaults to 10000", { type: "number", minimum: 1 }),
        ],
        responses: {
          200: success({
            results: { type: "integer" },
            data: {
              type: "object",
              properties: { matches: { type: "array", items: { $ref: "#/components/schemas/MatchResult" } } },
            },
          }),
          400: error("Matching calculation failed"),
          401: error("Authentication required"),
          404: error("Request not found"),
        },
      }),
    },
    "/api/v1/requests/{requestId}/status": {
      patch: operation({
        tag: "Requests",
        summary: "Update request status",
        description: "The assigned craftsman must make this request.",
        secured: true,
        parameters: [idParameter("requestId", "Request ID")],
        body: requestBody({
          type: "object",
          required: ["status"],
          properties: { status: { $ref: "#/components/schemas/RequestStatus" } },
        }),
        responses: {
          200: success({
            message: { type: "string" },
            data: { type: "object", properties: { request: jobRequestRef } },
          }),
          401: error("Authentication required"),
          403: error("Only the assigned craftsman may update this request"),
          404: error("Request not found"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/requests/{requestId}/complete": {
      patch: operation({
        tag: "Requests",
        summary: "Complete a request",
        description: "The assigned craftsman must make this request.",
        secured: true,
        parameters: [idParameter("requestId", "Request ID")],
        responses: {
          200: success({
            message: { type: "string" },
            data: { type: "object", properties: { request: jobRequestRef } },
          }),
          401: error("Authentication required"),
          403: error("Only the assigned craftsman may complete this request"),
          404: error("Request not found"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/requests/{requestId}/confirm-booking": {
      post: operation({
        tag: "Requests",
        summary: "Confirm booking and payment method",
        description: "The customer who owns the request must make this request after selecting a craftsman.",
        secured: true,
        parameters: [idParameter("requestId", "Request ID")],
        body: requestBody({
          type: "object",
          properties: { paymentMethod: { type: "string", enum: ["CASH", "CARD"] } },
        }),
        responses: {
          200: success({
            message: { type: "string" },
            data: { type: "object", properties: { request: jobRequestRef } },
          }),
          400: error("A craftsman must be selected first"),
          401: error("Authentication required"),
          403: error("Only the owning customer may confirm"),
          404: error("Request not found"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/requests/{requestId}/accept": {
      post: operation({
        tag: "Requests",
        summary: "Select or accept a craftsman",
        description:
          "A customer sends craftsmanId to select a craftsman; an assigned craftsman calls the same endpoint to accept the selected request.",
        secured: true,
        parameters: [idParameter("requestId", "Request ID")],
        body: requestBody(
          {
            type: "object",
            properties: { craftsmanId: { type: "string", description: "Required when called by a customer" } },
          },
          "Customer selection payload. Craftsmen may send an empty object.",
          false,
        ),
        responses: {
          200: success({
            message: { type: "string" },
            data: { type: "object", properties: { request: jobRequestRef } },
          }),
          400: error("Craftsman ID is missing"),
          401: error("Authentication required"),
          403: error("Customer or craftsman role required"),
          409: error("Request is no longer available"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/requests/{requestId}/reject": {
      post: operation({
        tag: "Requests",
        summary: "Reject an offered request",
        description: "Allowed role: craftsman. The request must exist in the craftsman's matching pool.",
        secured: true,
        parameters: [idParameter("requestId", "Request ID")],
        responses: {
          200: success({ message: { type: "string" } }),
          400: error("Request was not offered to this craftsman"),
          401: error("Authentication required"),
          403: error("Craftsman role required"),
          404: error("Request not found"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/admin/dashboard": {
      get: operation({
        tag: "Admin",
        summary: "Get platform dashboard statistics",
        description: "Allowed role: admin.",
        secured: true,
        responses: {
          200: success({ data: { type: "object", additionalProperties: true } }),
          401: error("Authentication required"),
          403: error("Admin role required"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/admin/users": {
      get: operation({
        tag: "Admin",
        summary: "List users",
        description: "Allowed role: admin.",
        secured: true,
        parameters: [
          queryParameter("search", "Search name, email, or phone", { type: "string" }),
          queryParameter("role", "Filter by role", { type: "string", enum: ["all", "customer", "craftsman", "admin"] }),
          queryParameter("status", "Filter by account status", { type: "string", enum: ["all", "active", "inactive"] }),
          queryParameter("page", "Page number", { type: "integer", minimum: 1, default: 1 }),
          queryParameter("limit", "Items per page", { type: "integer", minimum: 1, default: 10 }),
        ],
        responses: {
          200: success({
            results: { type: "integer" },
            data: {
              type: "object",
              properties: { users: { type: "array", items: userRef }, pagination: paginationRef },
            },
          }),
          401: error("Authentication required"),
          403: error("Admin role required"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/admin/users/{id}": {
      get: operation({
        tag: "Admin",
        summary: "Get a user and request history",
        description: "Allowed role: admin.",
        secured: true,
        parameters: [idParameter("id", "User ID")],
        responses: {
          200: success({
            data: {
              type: "object",
              properties: { user: userRef, requestHistory: { type: "array", items: jobRequestRef } },
            },
          }),
          401: error("Authentication required"),
          403: error("Admin role required"),
          404: error("User not found"),
          500: error("Internal server error"),
        },
      }),
      patch: operation({
        tag: "Admin",
        summary: "Update a user",
        description: "Allowed role: admin.",
        secured: true,
        parameters: [idParameter("id", "User ID")],
        body: requestBody({
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            role: { type: "string", enum: ["customer", "craftsman", "admin"] },
            isActive: { type: "boolean" },
            isAvailable: { type: "boolean" },
          },
        }),
        responses: {
          200: success({ data: { type: "object", properties: { user: userRef } } }),
          401: error("Authentication required"),
          403: error("Admin role required"),
          404: error("User not found"),
          500: error("Internal server error"),
        },
      }),
      delete: operation({
        tag: "Admin",
        summary: "Deactivate a user",
        description: "Soft-deletes the account by setting isActive=false. Allowed role: admin.",
        secured: true,
        parameters: [idParameter("id", "User ID")],
        responses: {
          200: success({ message: { type: "string" } }),
          401: error("Authentication required"),
          403: error("Admin role required"),
          404: error("User not found"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/admin/requests": {
      get: operation({
        tag: "Admin",
        summary: "List service requests",
        description: "Allowed role: admin.",
        secured: true,
        parameters: [
          queryParameter("status", "Filter by request status", { $ref: "#/components/schemas/RequestStatus" }),
          queryParameter("page", "Page number", { type: "integer", minimum: 1, default: 1 }),
          queryParameter("limit", "Items per page", { type: "integer", minimum: 1, default: 10 }),
        ],
        responses: {
          200: success({
            results: { type: "integer" },
            data: {
              type: "object",
              properties: { requests: { type: "array", items: jobRequestRef }, pagination: paginationRef },
            },
          }),
          401: error("Authentication required"),
          403: error("Admin role required"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/admin/disputes": {
      get: operation({
        tag: "Admin",
        summary: "List disputed requests",
        description: "Allowed role: admin.",
        secured: true,
        responses: {
          200: success({
            results: { type: "integer" },
            data: { type: "object", properties: { disputes: { type: "array", items: jobRequestRef } } },
          }),
          401: error("Authentication required"),
          403: error("Admin role required"),
          500: error("Internal server error"),
        },
      }),
    },
    "/api/v1/admin/disputes/{id}/resolve": {
      patch: operation({
        tag: "Admin",
        summary: "Resolve a dispute",
        description: "Allowed role: admin. A refund sets status REFUNDED; any other resolution sets COMPLETED.",
        secured: true,
        parameters: [idParameter("id", "Request ID")],
        body: requestBody({
          type: "object",
          required: ["resolution"],
          properties: {
            resolution: { type: "string", enum: ["refund", "complete"] },
            note: { type: "string" },
          },
        }),
        responses: {
          200: success({ data: { type: "object", properties: { request: jobRequestRef } } }),
          401: error("Authentication required"),
          403: error("Admin role required"),
          404: error("Request not found"),
          500: error("Internal server error"),
        },
      }),
    },
  },
};

module.exports = openApiDocument;
