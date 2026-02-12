json.payload do
  json.array! @pipelines do |pipeline|
    json.id pipeline.id
    json.name pipeline.name
    json.description pipeline.description
    json.color pipeline.color
    json.position pipeline.position
    json.account_id pipeline.account_id
    json.created_at pipeline.created_at
    json.updated_at pipeline.updated_at
    
    json.stages pipeline.pipeline_stages.ordered do |stage|
      json.id stage.id
      json.name stage.name
      json.position stage.position
      json.color stage.color
    end
  end
end
