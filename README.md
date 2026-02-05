# LookML Add View From Table

This is a Looker extension that allows you to quickly add a view to a model from a table. This is particularly useful when

- your schema has a large number of tables
- you want to search across projects, databases or schemas

- Requires the end user to be in development mode
- The user must be a developer on the project they are adding to

undoc.json has the API for generating lookml
swagger.json has the rest of the APIs.

## Limiting Access

You may only want to allow access to this extension to users who are developers. If you don't want to show it to users in the Applications sidebar in Looker's sidebar navigation, you should

1. Create a new project
2. Create a new model with no explores/views
3. Create a project manifest (manifest.lkml)
4. Add the application definition from manifest.lkml in the manifest file.
5. Make sure your non developers do not have access to this model in Admin > Roles
