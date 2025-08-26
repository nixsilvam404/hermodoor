/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/hermodoor.json`.
 */
export type Hermodoor = {
  "address": "FrFGfdqsY6pcKianF4rFFQXbmVJXFwrCGDJstfgondJz",
  "metadata": {
    "name": "hermodoor",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "closeDoor",
      "discriminator": [
        113,
        93,
        153,
        94,
        138,
        63,
        103,
        41
      ],
      "accounts": [
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "cycle"
        },
        {
          "name": "participant",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  65,
                  82,
                  84,
                  73,
                  67,
                  73,
                  80,
                  65,
                  78,
                  84,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              },
              {
                "kind": "account",
                "path": "cycle"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "joinCycle",
      "discriminator": [
        49,
        71,
        250,
        52,
        222,
        37,
        47,
        157
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "cycle"
        },
        {
          "name": "participant",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  80,
                  65,
                  82,
                  84,
                  73,
                  67,
                  73,
                  80,
                  65,
                  78,
                  84,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              },
              {
                "kind": "account",
                "path": "cycle"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "nickname",
          "type": "string"
        }
      ]
    },
    {
      "name": "nextCycle",
      "discriminator": [
        65,
        175,
        174,
        124,
        69,
        233,
        84,
        200
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  69,
                  71,
                  73,
                  83,
                  84,
                  82,
                  89,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "cycle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  67,
                  89,
                  67,
                  76,
                  69,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "account",
                "path": "registry.next_round",
                "account": "registry"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "startGame",
      "discriminator": [
        249,
        47,
        252,
        172,
        184,
        162,
        245,
        14
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "registry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  82,
                  69,
                  71,
                  73,
                  83,
                  84,
                  82,
                  89,
                  95,
                  83,
                  69,
                  69,
                  68
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "cycle",
      "discriminator": [
        189,
        110,
        197,
        59,
        103,
        0,
        241,
        115
      ]
    },
    {
      "name": "participant",
      "discriminator": [
        32,
        142,
        108,
        79,
        247,
        179,
        54,
        6
      ]
    },
    {
      "name": "registry",
      "discriminator": [
        47,
        174,
        110,
        246,
        184,
        182,
        252,
        218
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Unauthorized: only the registry authority may perform this action"
    },
    {
      "code": 6001,
      "name": "roundLimitExceeded",
      "msg": "Round limit exceeded: the facility cannot support more cycles"
    },
    {
      "code": 6002,
      "name": "badTime",
      "msg": "The provided event timings are inconsistent or invalid"
    },
    {
      "code": 6003,
      "name": "nicknameTooLong",
      "msg": "Nickname too long"
    },
    {
      "code": 6004,
      "name": "registrationClosed",
      "msg": "Registration is closed"
    },
    {
      "code": 6005,
      "name": "alreadyClosed",
      "msg": "You already closed the hermodoor for this cycle"
    }
  ],
  "types": [
    {
      "name": "cycle",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u64"
          },
          {
            "name": "quietStart",
            "type": "i64"
          },
          {
            "name": "alarmStart",
            "type": "i64"
          },
          {
            "name": "cooldownStart",
            "type": "i64"
          },
          {
            "name": "cooldownEnd",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "partStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "dismissed"
          },
          {
            "name": "saved"
          },
          {
            "name": "late"
          }
        ]
      }
    },
    {
      "name": "participant",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "cycle",
            "type": "pubkey"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "partStatus"
              }
            }
          },
          {
            "name": "nickname",
            "type": "string"
          },
          {
            "name": "closeTime",
            "type": "i64"
          },
          {
            "name": "points",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "registry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "t0",
            "type": "i64"
          },
          {
            "name": "nextRound",
            "type": "u64"
          },
          {
            "name": "maxRounds",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
