{
  `path`: `u:/mcp/prompt-generator.yml`,
  `content`: `app:
  description: ''
  icon: 🤖
  icon_background: '#EFF1F5'
  mode: advanced-chat
  name: 'System Prompt Generator'
  use_icon_as_answer_icon: false
kind: app
version: 0.1.5
workflow:
  conversation_variables: []
  environment_variables: []
  features:
    file_upload:
      allowed_file_extensions: []
      allowed_file_types: []
      enabled: false
    opening_statement: ''
    retriever_resource:
      enabled: false
    sensitive_word_avoidance:
      enabled: false
    speech_to_text:
      enabled: false
    suggested_questions: []
    text_to_speech:
      enabled: false
  graph:
    edges:
    - data:
        isInIteration: false
        sourceType: start
        targetType: llm
      id: 1716783101349-source-1716783205923-target
      source: '1716783101349'
      sourceHandle: source
      target: '1716783205923'
      targetHandle: target
      type: custom
      zIndex: 0
    - data:
        isInIteration: false
        sourceType: llm
        targetType: code
      id: 1716783205923-source-1716783405935-target
      source: '1716783205923'
      sourceHandle: source
      target: '1716783405935'
      targetHandle: target
      type: custom
      zIndex: 0
    nodes:
    - data:
        desc: ''
        title: Start
        type: start
        variables:
        - label: \"Base Role\"
          max_length: 256
          required: true
          type: text-input
          variable: role_description
        - label: \"Capabilities\"
          max_length: 33024
          type: paragraph
          variable: capability_areas
      height: 115
      id: '1716783101349'
      position:
        x: 30
        y: 310
      type: custom
      width: 243
    - data:
        context:
          enabled: false
          variable_selector: []
        model:
          completion_params:
            temperature: 0.7
          mode: chat
          name: gpt-4
          provider: openai
        prompt_template:
        - id: response-id-1
          role: system
          text: |
            You are to create a system prompt structure. Convert the role and capabilities into JSON components.
            Each component should have:
            - \"section\": The component name (e.g. Core Identity, Knowledge Domains)
            - \"bullets\": Key directives for this section
            Output only valid JSON array.
        - id: response-id-2
          role: user
          text: |
            Generate prompt components for:
            Role: {{#1716783101349.role_description#}}
            Capabilities: {{#1716783101349.capability_areas#}}
      id: '1716783205923'
      position:
        x: 383
        y: 310
      type: custom
      width: 243
    - data:
        code: \"const main = (arg1) => {\
  const data = JSON.parse(arg1);\
  return {\
    result: data.map(item => ({\
      section: item.section,\
      bullets: item.bullets\
    }))\
  };\
}\"
        outputs:
          result:
            type: array[object]
        title: Parse Components
        type: code
      id: '1716783405935'
      position:
        x: 638
        y: 310
      type: custom
      width: 243
    viewport:
      x: 0
      y: 0
      zoom: 1`
}