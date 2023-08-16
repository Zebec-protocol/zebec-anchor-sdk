export type BatchTransfer = {
	"version": "0.1.0",
	"name": "batch_transfer",
	"instructions": [
	  {
		"name": "depositSol",
		"accounts": [
		  {
			"name": "authority",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": "u64"
		  }
		]
	  },
	  {
		"name": "depositToken",
		"accounts": [
		  {
			"name": "authority",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "from",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "batchVaultTokenAccount",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "mint",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "tokenProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "associatedTokenProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": "u64"
		  }
		]
	  },
	  {
		"name": "withdrawSol",
		"accounts": [
		  {
			"name": "authority",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": "u64"
		  }
		]
	  },
	  {
		"name": "withdrawToken",
		"accounts": [
		  {
			"name": "authority",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "to",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "batchVaultTokenAccount",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "batchVault",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "mint",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "tokenProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "associatedTokenProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": "u64"
		  }
		]
	  },
	  {
		"name": "batchSolTransfer",
		"accounts": [
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "fromAuthority",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": {
			  "vec": "u64"
			}
		  }
		]
	  },
	  {
		"name": "batchTokenTransfer",
		"accounts": [
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "fromAuthority",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "batchVaultTokenAccount",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "mint",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "tokenProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": {
			  "vec": "u64"
			}
		  }
		]
	  },
	  {
		"name": "cronBatchSolTransfer",
		"accounts": [
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "fromAuthority",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "thread",
			"isMut": false,
			"isSigner": true
		  },
		  {
			"name": "payer",
			"isMut": false,
			"isSigner": true
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": {
			  "vec": "u64"
			}
		  }
		],
		"returns": {
		  "defined": "ThreadResponse"
		}
	  },
	  {
		"name": "cronBatchTokenTransfer",
		"accounts": [
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "fromAuthority",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "batchVaultTokenAccount",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "mint",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "tokenProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "thread",
			"isMut": false,
			"isSigner": true
		  },
		  {
			"name": "payer",
			"isMut": false,
			"isSigner": true
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": {
			  "vec": "u64"
			}
		  }
		],
		"returns": {
		  "defined": "ThreadResponse"
		}
	  },
	  {
		"name": "multisigBatchSolTransfer",
		"accounts": [
		  {
			"name": "sender",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": {
			  "vec": "u64"
			}
		  }
		]
	  },
	  {
		"name": "multisigBatchTokenTransfer",
		"accounts": [
		  {
			"name": "sender",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "senderTokenAccount",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "mint",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "tokenProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": {
			  "vec": "u64"
			}
		  }
		]
	  }
	],
	"errors": [
	  {
		"code": 6000,
		"name": "InsufficientFunds",
		"msg": "Insufficient funds"
	  }
	]
  };
  
  export const IDL: BatchTransfer = {
	"version": "0.1.0",
	"name": "batch_transfer",
	"instructions": [
	  {
		"name": "depositSol",
		"accounts": [
		  {
			"name": "authority",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": "u64"
		  }
		]
	  },
	  {
		"name": "depositToken",
		"accounts": [
		  {
			"name": "authority",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "from",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "batchVaultTokenAccount",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "mint",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "tokenProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "associatedTokenProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": "u64"
		  }
		]
	  },
	  {
		"name": "withdrawSol",
		"accounts": [
		  {
			"name": "authority",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": "u64"
		  }
		]
	  },
	  {
		"name": "withdrawToken",
		"accounts": [
		  {
			"name": "authority",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "to",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "batchVaultTokenAccount",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "batchVault",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "mint",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "tokenProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "associatedTokenProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": "u64"
		  }
		]
	  },
	  {
		"name": "batchSolTransfer",
		"accounts": [
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "fromAuthority",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": {
			  "vec": "u64"
			}
		  }
		]
	  },
	  {
		"name": "batchTokenTransfer",
		"accounts": [
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "fromAuthority",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "batchVaultTokenAccount",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "mint",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "tokenProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": {
			  "vec": "u64"
			}
		  }
		]
	  },
	  {
		"name": "cronBatchSolTransfer",
		"accounts": [
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "fromAuthority",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "thread",
			"isMut": false,
			"isSigner": true
		  },
		  {
			"name": "payer",
			"isMut": false,
			"isSigner": true
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": {
			  "vec": "u64"
			}
		  }
		],
		"returns": {
		  "defined": "ThreadResponse"
		}
	  },
	  {
		"name": "cronBatchTokenTransfer",
		"accounts": [
		  {
			"name": "batchVault",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "fromAuthority",
			"isMut": true,
			"isSigner": false
		  },
		  {
			"name": "batchVaultTokenAccount",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "mint",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "tokenProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "rent",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "thread",
			"isMut": false,
			"isSigner": true
		  },
		  {
			"name": "payer",
			"isMut": false,
			"isSigner": true
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": {
			  "vec": "u64"
			}
		  }
		],
		"returns": {
		  "defined": "ThreadResponse"
		}
	  },
	  {
		"name": "multisigBatchSolTransfer",
		"accounts": [
		  {
			"name": "sender",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "systemProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": {
			  "vec": "u64"
			}
		  }
		]
	  },
	  {
		"name": "multisigBatchTokenTransfer",
		"accounts": [
		  {
			"name": "sender",
			"isMut": true,
			"isSigner": true
		  },
		  {
			"name": "senderTokenAccount",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "mint",
			"isMut": false,
			"isSigner": false
		  },
		  {
			"name": "tokenProgram",
			"isMut": false,
			"isSigner": false
		  }
		],
		"args": [
		  {
			"name": "amount",
			"type": {
			  "vec": "u64"
			}
		  }
		]
	  }
	],
	"errors": [
	  {
		"code": 6000,
		"name": "InsufficientFunds",
		"msg": "Insufficient funds"
	  }
	]
  };
  