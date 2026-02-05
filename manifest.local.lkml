application: create_view_from_table {
  label: "Create View From Table (Local)"
  url: "https://localhost:8080/bundle.js"
  entitlements: {
    core_api_methods: [
      "me",
      "all_connections",
      "all_projects",
      "connection_schemas",
      "connection_tables",
      "connection_columns",
      "connection_databases"
    ]
    navigation: yes
    use_embeds: yes
    use_iframes: yes
    new_window: yes
    use_form_submit: yes
    raw_api_request: yes
    local_storage: yes
  }
  mount_points: {
    standalone: yes
  }
}