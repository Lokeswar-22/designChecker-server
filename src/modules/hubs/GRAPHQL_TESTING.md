# GraphQL Testing Guide

## Overview

This guide explains how to test the GraphQL implementation for the AEC Data Model API.

## API Endpoint

The service uses the AEC Data Model API endpoint:
```
https://developer.api.autodesk.com/aecdatamodel/v1/graphql
```

## Test Endpoints

### 1. Get Hubs
```
GET http://localhost:3005/hubs?apsUserId=YOUR_APS_USER_ID
```

**GraphQL Query Used:**
```graphql
query {
  hubs {
    results {
      id
      name
    }
    pagination {
      cursor
    }
  }
}
```

### 2. Get Projects
```
GET http://localhost:3005/hubs/HUB_ID/projects?apsUserId=YOUR_APS_USER_ID
```

**GraphQL Query Used:**
```graphql
query ($hubId:ID!) {
  projects(hubId:$hubId) {
    results {
      id
      name
    }
    pagination {
      cursor
    }
  }
}
```

### 3. Get Element Groups
```
GET http://localhost:3005/hubs/HUB_ID/projects/PROJECT_ID/element-groups?apsUserId=YOUR_APS_USER_ID
```

**GraphQL Query Used:**
```graphql
query ($projectId:ID!) {
  elementGroupsByProject(projectId:$projectId) {
    results {
      id
      name
      alternativeIdentifiers {
        dataManagementAPIProjectId
      }
    }
    pagination {
      cursor
    }
  }
}
```

## Testing Steps

1. **Start the application:**
   ```bash
   npm run start:dev
   ```

2. **Test with curl or Postman:**
   ```bash
   # Test hubs
   curl -X GET "http://localhost:3005/hubs?apsUserId=YOUR_APS_USER_ID" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

   # Test projects
   curl -X GET "http://localhost:3005/hubs/hub-id/projects?apsUserId=YOUR_APS_USER_ID" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

   # Test element groups
   curl -X GET "http://localhost:3005/hubs/hub-id/projects/project-id/element-groups?apsUserId=YOUR_APS_USER_ID" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Expected Behavior

### Success Response
The service will return the GraphQL response data directly:
```json
{
  "hubs": {
    "results": [
      {
        "id": "hub-1",
        "name": "Hub Name"
      }
    ],
    "pagination": {
      "cursor": "next-cursor"
    }
  }
}
```

### Error Response
If the GraphQL query fails, the service will throw an error with the GraphQL error details.

## Console Output

The service logs the GraphQL response for debugging:
```
response : { data: { hubs: { results: [...] } } }
```

## Important Notes

1. **Authentication Required**: All endpoints require valid APS user authentication
2. **AEC Data Model API Access**: Requires access to the AEC Data Model API beta program
3. **Real Data**: The queries will only return real data if you have:
   - Published Revit models in ACC
   - Proper project and hub access
   - Valid design IDs

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your APS user ID and token
2. **GraphQL Errors**: Check the console output for specific GraphQL error messages
3. **Empty Results**: Ensure you have published Revit models in your ACC projects

### Debug Steps

1. Check the console output for GraphQL responses
2. Verify your APS user has access to the required projects
3. Ensure the AEC Data Model API beta access is enabled
4. Test with the official AEC Data Model Explorer tool first

## Next Steps

1. Test with real APS user IDs and project data
2. Implement proper error handling for specific GraphQL errors
3. Add data transformation if needed for frontend consumption
4. Consider caching for frequently accessed data