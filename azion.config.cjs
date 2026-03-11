/**
 * This file was automatically generated based on your preset configuration.
 *
 * For better type checking and IntelliSense:
 * 1. Install azion as dev dependency:
 *    npm install -D azion
 *
 * 2. Use defineConfig:
 *    import { defineConfig } from 'azion'
 *
 * 3. Replace the configuration with defineConfig:
 *    export default defineConfig({
 *      // Your configuration here
 *    })
 *
 * For more configuration options, visit:
 * https://github.com/aziontech/lib/tree/main/packages/config
 */

module.exports = {
  build: {
    preset: 'opennextjs',
    polyfills: true
  },
  storage: [
    {
      name: 'TarotWhisper-20260310162134',
      prefix: '20260311084644',
      dir: './.edge/assets',
      workloadsAccess: 'read_write'
    }
  ],
  connectors: [
    {
      name: 'TarotWhisper-20260310162134',
      active: true,
      type: 'storage',
      attributes: {
        bucket: 'TarotWhisper-20260310162134',
        prefix: '20260311084644'
      }
    }
  ],
  functions: [
    {
      name: 'TarotWhisper-20260310162134',
      path: './functions/worker.js',
      bindings: {
        storage: {
          bucket: 'TarotWhisper-20260310162134',
          prefix: '20260311084644'
        }
      }
    }
  ],
  applications: [
    {
      name: 'TarotWhisper-20260310162134',
      cache: [
        {
          name: 'TarotWhisper-20260310162134',
          browser: {
            maxAgeSeconds: 7200
          },
          edge: {
            maxAgeSeconds: 7200
          }
        }
      ],
      rules: {
        request: [
          {
            name: 'Set storage origin for all requests _next_static and set cache policy',
            description:
              'Serve Next.js static assets through edge connector and set cache policy',
            active: true,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'matches',
                  argument: '^/_next/static/'
                }
              ]
            ],
            behaviors: [
              {
                type: 'set_connector',
                attributes: {
                  value: 'TarotWhisper-20260310162134'
                }
              },
              {
                type: 'set_cache_policy',
                attributes: {
                  value: 'TarotWhisper-20260310162134'
                }
              },
              {
                type: 'deliver'
              }
            ]
          },
          {
            name: 'Deliver Static Assets and set cache policy',
            description:
              'Serve static assets through edge connector and set cache policy',
            active: true,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'matches',
                  argument:
                    '.(css|js|ttf|woff|woff2|pdf|svg|jpg|jpeg|gif|bmp|png|ico|mp4|json)$'
                }
              ]
            ],
            behaviors: [
              {
                type: 'set_connector',
                attributes: {
                  value: 'TarotWhisper-20260310162134'
                }
              },
              {
                type: 'set_cache_policy',
                attributes: {
                  value: 'TarotWhisper-20260310162134'
                }
              },
              {
                type: 'deliver'
              }
            ]
          },
          {
            name: 'Execute Function',
            description: 'Execute function for all requests',
            active: true,
            criteria: [
              [
                {
                  variable: '${uri}',
                  conditional: 'if',
                  operator: 'matches',
                  argument: '^/'
                }
              ]
            ],
            behaviors: [
              {
                type: 'run_function',
                attributes: {
                  value: 'TarotWhisper-20260310162134'
                }
              },
              {
                type: 'forward_cookies'
              }
            ]
          }
        ]
      },
      functionsInstances: [
        {
          name: 'TarotWhisper-20260310162134',
          ref: 'TarotWhisper-20260310162134'
        }
      ]
    }
  ],
  workloads: [
    {
      name: 'TarotWhisper-20260310162134',
      active: true,
      infrastructure: 1,
      deployments: [
        {
          name: 'TarotWhisper-20260310162134',
          current: true,
          active: true,
          strategy: {
            type: 'default',
            attributes: {
              application: 'TarotWhisper-20260310162134'
            }
          }
        }
      ]
    }
  ]
}
