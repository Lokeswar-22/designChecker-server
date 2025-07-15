<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# Design Checker Server

This is a NestJS server application that provides APIs for design checking and AEC data model integration.

## Features

- Authentication and authorization
- ACC (Autodesk Construction Cloud) integration
- Hubs and projects management
- Document upload and management
- **AEC Data Model APIs** - Complete implementation of all tutorial APIs

## AEC Data Model APIs

The server now includes comprehensive AEC Data Model API integration based on the [AEC Data Model Tutorial](https://aps.autodesk.com/en/docs/aecdatamodel/v1/tutorials/tutorial02/). All APIs use GraphQL queries to interact with the Autodesk AEC Data Model service.

### Base URL
All AEC Data Model endpoints are prefixed with `/aecDataModel`

### Authentication
All endpoints require authentication via the `AuthGuard` and an `accUserId` query parameter.

### Implemented APIs

#### 1. Get ElementGroups Based on Metadata

**Basic ElementGroups:**
```
GET /aecDataModel/projects/{projectId}/element-groups?accUserId={accUserId}
```

**ElementGroups with Metadata Filter:**
```
POST /aecDataModel/projects/{projectId}/element-groups/metadata?accUserId={accUserId}
Body: {
  "metadata": {
    "name": "Category",
    "value": "Doors"
  }
}
```

#### 2. Get Versions of an ElementGroup

```
GET /aecDataModel/element-groups/{elementGroupId}/versions?accUserId={accUserId}
```

#### 3. Get Element Instances of a Particular Type

```
GET /aecDataModel/element-groups/{elementGroupId}/elements/type/{elementType}?accUserId={accUserId}
Body: {
  "filter": {
    "propertyFilter": "Area > 100"
  }
}
```

#### 4. Get Element Instances in a Category by Version

```
GET /aecDataModel/element-groups/{elementGroupId}/elements/category/{category}?accUserId={accUserId}&versionId={versionId}
Body: {
  "filter": {
    "propertyFilter": "Material = 'Steel'"
  }
}
```

#### 5. Get Project Elements with Specific Properties

```
POST /aecDataModel/projects/{projectId}/elements/properties?accUserId={accUserId}
Body: {
  "propertyFilter": {
    "name": "Area",
    "value": "> 100",
    "operator": "GREATER_THAN"
  }
}
```

#### 6. Get Elements by using Instances or Reference

**By Instances:**
```
POST /aecDataModel/element-groups/{elementGroupId}/elements/instances?accUserId={accUserId}
Body: {
  "elementIds": ["element1", "element2", "element3"]
}
```

**By References:**
```
POST /aecDataModel/element-groups/{elementGroupId}/elements/references?accUserId={accUserId}
Body: {
  "elementIds": ["element1", "element2", "element3"]
}
```

#### 7. Get Distinct Values of Properties

**By Property Definition ID:**
```
GET /aecDataModel/projects/{projectId}/properties/{propertyDefinitionId}/distinct-values?accUserId={accUserId}
```

**By Property Name:**
```
GET /aecDataModel/projects/{projectId}/properties/name/{propertyName}/distinct-values?accUserId={accUserId}
```

### Additional Helper Endpoints

#### Get Property Definitions
```
GET /aecDataModel/projects/{projectId}/property-definitions?accUserId={accUserId}
```

#### Get Design Versions
```
GET /aecDataModel/projects/{projectId}/design-versions?accUserId={accUserId}
```

#### Generic Element Query
```
POST /aecDataModel/element-groups/{elementGroupId}/elements?accUserId={accUserId}
Body: {
  "filter": {
    "category": "Doors",
    "type": "Door",
    "propertyFilter": "Width > 800"
  }
}
```

### Response Format

All APIs return data in the following GraphQL-based format:

```json
{
  "results": [
    {
      "id": "element-id",
      "name": "Element Name",
      "properties": {
        "results": [
          {
            "name": "Property Name",
            "value": "Property Value",
            "definition": {
              "name": "Definition Name",
              "units": {
                "name": "Unit Name"
              }
            }
          }
        ]
      }
    }
  ],
  "pagination": {
    "cursor": "next-page-cursor"
  }
}
```

### Error Handling

All endpoints include proper error handling:
- **401 Unauthorized**: When authentication fails or token is invalid
- **400 Bad Request**: When required parameters are missing
- **500 Internal Server Error**: When GraphQL queries fail

### Example Usage

```javascript
// Get element groups for a project
const elementGroups = await fetch('/aecDataModel/projects/project123/element-groups?accUserId=user123');

// Get elements by type with filter
const elements = await fetch('/aecDataModel/element-groups/group123/elements/type/Door?accUserId=user123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filter: { propertyFilter: 'Width > 800' }
  })
});

// Get distinct property values
const distinctValues = await fetch('/aecDataModel/projects/project123/properties/name/Material/distinct-values?accUserId=user123');
```

## Installation

```bash
npm install
```

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# APS (Autodesk Platform Services) configuration
APS_CLIENT_ID=your_aps_client_id
APS_CLIENT_SECRET=your_aps_client_secret
APS_CALLBACK_URL=http://localhost:3000/api/auth/callback

# JWT configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
```

## API Documentation

The server provides comprehensive REST APIs for:

- Authentication (`/auth`)
- User management (`/user`)
- ACC integration (`/acc-auth`)
- Hubs and projects (`/hubs`)
- Document management (`/document`)
- **AEC Data Model (`/aecDataModel`)** - Complete tutorial implementation

## Architecture

The application follows NestJS best practices with:

- **Modules**: Feature-based organization
- **Controllers**: Handle HTTP requests
- **Services**: Business logic implementation
- **Guards**: Authentication and authorization
- **Entities**: Database models
- **DTOs**: Data transfer objects

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
