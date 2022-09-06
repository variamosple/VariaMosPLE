export const mockReturnedValue = {
                                   "transactionId": "getDetailLanguages_",
                                   "message": "Language were found successfully",
                                   "data": [
                                     {
                                       "id": 103,
                                       "name": "istar",
                                       "abstractSyntax": {
                                         "elements": {
                                           "Goal": {
                                             "properties": [
                                               {
                                                 "name": "Selected",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "Undefined,Selected,Unselected"
                                               }
                                             ]
                                           },
                                           "Bundle": {
                                             "properties": [
                                               {
                                                 "name": "Type",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "And,Or,Xor,Range"
                                               },
                                               {
                                                 "name": "RangeMin",
                                                 "type": "String",
                                                 "linked_value": "Range",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "RangeMax",
                                                 "type": "String",
                                                 "linked_value": "Range",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "Testing",
                                                 "type": "Integer",
                                                 "comment": "prueba",
                                                 "possibleValues": "1..10"
                                               }
                                             ]
                                           },
                                           "RootFeature": {
                                             "properties": [
                                               {
                                                 "name": "Selected",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "Undefined,Selected,Unselected"
                                               }
                                             ]
                                           },
                                           "AbstractFeature": {
                                             "properties": [
                                               {
                                                 "name": "Selected",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "Undefined,Selected,Unselected"
                                               }
                                             ]
                                           },
                                           "ConcreteFeature": {
                                             "properties": [
                                               {
                                                 "name": "Selected",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "Undefined,Selected,Unselected"
                                               }
                                             ]
                                           }
                                         },
                                         "restrictions": {
                                           "quantity_element": [
                                             {
                                               "max": 1,
                                               "min": 1,
                                               "element": "RootFeature"
                                             }
                                           ]
                                         },
                                         "relationships": {
                                           "Bundle_Feature": {
                                             "max": 9999999,
                                             "min": 1,
                                             "source": "Bundle",
                                             "target": [
                                               "AbstractFeature",
                                               "ConcreteFeature"
                                             ],
                                             "properties": []
                                           },
                                           "RootFeature_Feature": {
                                             "max": 9999999,
                                             "min": 1,
                                             "source": "RootFeature",
                                             "target": [
                                               "AbstractFeature",
                                               "ConcreteFeature",
                                               "Bundle"
                                             ],
                                             "properties": [
                                               {
                                                 "name": "Type",
                                                 "type": "String",
                                                 "possibleValues": "Mandatory,Optional,Includes,Excludes,IndividualCardinality"
                                               },
                                               {
                                                 "name": "MinValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "MaxValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               }
                                             ]
                                           },
                                           "AbstractFeature_Feature": {
                                             "max": 9999999,
                                             "min": 1,
                                             "source": "AbstractFeature",
                                             "target": [
                                               "AbstractFeature",
                                               "ConcreteFeature",
                                               "Bundle"
                                             ],
                                             "properties": [
                                               {
                                                 "name": "Type",
                                                 "type": "String",
                                                 "possibleValues": "Mandatory,Optional,Includes,Excludes,IndividualCardinality"
                                               },
                                               {
                                                 "name": "MinValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "MaxValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               }
                                             ]
                                           },
                                           "ConcreteFeature_Feature": {
                                             "max": 9999999,
                                             "min": 1,
                                             "source": "ConcreteFeature",
                                             "target": [
                                               "AbstractFeature",
                                               "ConcreteFeature",
                                               "Bundle"
                                             ],
                                             "properties": [
                                               {
                                                 "name": "Type",
                                                 "type": "String",
                                                 "possibleValues": "Mandatory,Optional,Includes,Excludes,IndividualCardinality"
                                               },
                                               {
                                                 "name": "MinValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "MaxValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               }
                                             ]
                                           }
                                         }
                                       },
                                       "concreteSyntax": {
                                         "elements": {
                                           "Goal": {
                                             "draw": "PHNoYXBlIG5hbWU9IlJvb3RGZWF0dXJlIiBhc3BlY3Q9InZhcmlhYmxlIiBzdHJva2V3aWR0aD0iNyI+DQoJPGJhY2tncm91bmQ+DQoJCTxzdHJva2Vjb2xvciBjb2xvcj0iIzQ0NmU3OSIvPg0KCQk8ZmlsbGNvbG9yIGNvbG9yPSIjZmZmZmZmIi8+DQoJCTxwYXRoPg0KCQkJPG1vdmUgeD0iMCIgeT0iMCIvPg0KCQkJPGxpbmUgeD0iMTAwIiB5PSIwIi8+DQoJCQk8bGluZSB4PSIxMDAiIHk9IjEwMCIvPg0KCQkJPGxpbmUgeD0iMCIgeT0iMTAwIi8+DQoJCQk8bGluZSB4PSIwIiB5PSIwIi8+DQoJCQk8Y2xvc2UvPiANCgkJPC9wYXRoPgkJDQoJPC9iYWNrZ3JvdW5kPg0KCTxmb3JlZ3JvdW5kPg0KCQk8ZmlsbHN0cm9rZS8+DQoJPC9mb3JlZ3JvdW5kPg0KPC9zaGFwZT4=",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAACEAAAAQCAYAAACYwhZnAAAAR0lEQVRIS+2VMQoAMAgDk5dHX57SQpdCZ5f4AcNxGkoyhocALGksRnfjhLDnYJBMiKNASNxLCImQeL9inIgTXyeqaqxF9+4FTfM+fusqx+IAAAAASUVORK5CYII=",
                                             "label": "Goal1",
                                             "width": 100,
                                             "design": "shape=ConcreteFeature;",
                                             "height": 50
                                           },
                                           "Bundle": {
                                             "draw": "PHNoYXBlIG5hbWU9ImNvbXBvbmVudCIgYXNwZWN0PSJmaXhlZCIgc3Ryb2tld2lkdGg9IjIiPgoJPGJhY2tncm91bmQ+CgkJPHN0cm9rZWNvbG9yIGNvbG9yPSIjNDQ2ZTc5Ii8+CgkJPGZpbGxjb2xvciBjb2xvcj0iI2ZmZmZmZiIvPgoJCTxwYXRoPiAKCQkJPGVsbGlwc2UgeD0iMCIgeT0iMCIgdz0iMTAwIiBoPSIxMDAiLz4gCgkJPC9wYXRoPgkJCgk8L2JhY2tncm91bmQ+Cgk8Zm9yZWdyb3VuZD4KCQk8ZmlsbHN0cm9rZS8+Cgk8L2ZvcmVncm91bmQ+Cjwvc2hhcGU+",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAACE0lEQVRIS7WVv6v5YRTH3zaL3wYDizLIxMBCyT+AJJNEWCkpBjuDYiKUSULiL/BjU4qESUhsfkRZTG7PR1yuz/12fd17xuc5z+v8es45jPP5fAaNbDYbhMNhVKtVsFgsKJVK6PV6tFot9Pt9HI9HWCwWRKNR8Pn8JwKDDpxOpxGJRFCr1aBQKMDj8Z4e7nY7jMdjmEwmCu7xeB50nsBmsxkikQipVIouENozr9eLw+GAUql0u38AEygJ1+fz/Rh6VYzH4+h0OqhUKtTRDUzCHwwGL3n61TpJh0ajgdvtvoBJoeRyOdbr9cuefn1A6jGfzy9gYsnhcECr1b4NbrfbKBaLFzD5LtPplLb6r1q6Rs9YLBZnnU6HxWLxKuNbfYlEAka9Xj/n83nU6/VfAxuNRjASiQTVI36//9fAyWTyDz3+sxyTPAgEAkwmE9ph8mp+SC+Q+UJ9N9Lrdrsd5He8K81mE+Vy+QImk0omk2G73b7LBYfDwXK5/JwV2WwW3W4XmUzmv+Eul4uK2ul0foIJzWazQa1WIxAIvAwnM3k4HKJQKDxOtyvJarWCy+WCRPBTIZ6eTqcb9GFs3kNyuRyCwSDVjaTCQqHwyQap/mg0ojZIIpGgwr8X2tVEFPb7PUKhELXzmEwmVCoVDAYDGo0Ger0e5SHZebFYDGw2+8nwt+B7zdVqRcFmsxmkUillRCwW/zNTH/HNGKNltOpYAAAAAElFTkSuQmCC",
                                             "label": "Bundle",
                                             "width": 100,
                                             "design": "shape=Bundle",
                                             "height": 50,
                                             "label_property": "Type"
                                           },
                                           "RootFeature": {
                                             "draw": "PHNoYXBlIG5hbWU9IlJvb3RGZWF0dXJlIiBhc3BlY3Q9InZhcmlhYmxlIiBzdHJva2V3aWR0aD0iMTEiPg0KCTxiYWNrZ3JvdW5kPg0KCQk8c3Ryb2tlY29sb3IgY29sb3I9IiM0NDZlNzkiLz4NCgkJPGZpbGxjb2xvciBjb2xvcj0iI2ZmZmZmZiIvPg0KCQk8cGF0aD4NCgkJCTxtb3ZlIHg9IjAiIHk9IjAiLz4NCgkJCTxsaW5lIHg9IjEwMCIgeT0iMCIvPg0KCQkJPGxpbmUgeD0iMTAwIiB5PSIxMDAiLz4NCgkJCTxsaW5lIHg9IjAiIHk9IjEwMCIvPg0KCQkJPGxpbmUgeD0iMCIgeT0iMCIvPg0KCQkJPGNsb3NlLz4gDQoJCTwvcGF0aD4JCQ0KCTwvYmFja2dyb3VuZD4NCgk8Zm9yZWdyb3VuZD4NCgkJPGZpbGxzdHJva2UvPg0KCTwvZm9yZWdyb3VuZD4NCjwvc2hhcGU+",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAACMAAAASCAYAAADR/2dRAAACY3pUWHRteEdyYXBoTW9kZWwAAE1Ty7KiMBT8GqpmFpcKBAIueQiCTxTUyw4kYJRnQEG+fsJwp2o2yanuPqmubuCgUQwpyTEngqJKSEpwwkGTE0URCIsvIH2Jgi9IHNQExA4g8kAEIaOZ/l613azt+55PaNTzpJqpKMPlD7etRpLnESdaMg8Y9etCyqTqWzbufHYIgMFQZxMjkDSPA5J+s0ur6xxfcLwm3bQPFR6i6Yn1yt9uONFgc06ek3cb357VtGLcaVUwxFIgD5hchbwAICNOURpR8t8zk883pi2pytkpc4J4OBO4i7IZhXZ5vRmPMUgM+XTsS4eo5azpPjWeNVlVZVOEIgeXHDQSEmU0KpiE/IS5WA3hCWlf6/aN81ebyd/ZepY/QmcRq15mOixVy7y2J6Xx9/6UVwdIboYDvWWOkhFXK1CkvvdBz4l6Yja1Ma4P8eXDhMXB/pQJuqGdtzo9jPaz95dMpLWUNIlvtZI16vaNIWZhDMUzDGKkn96q4QUyAPoGeUhf7VguR4E8urOpaMNhL12zLdsA4Uh3jau/ZO3sdaM/MkxYONTeF7c47dOksTx5VB+ji2sqQaM/T1vkju/18drYXtnmriMpA6tK3+a9cjyiV8I8bppnMRSHFPWbl6hsTdaH9fGCLbZWhWMXNVXU0j5Jpudu0m0sqYiAO6r8BXaSXlFXdTnQnoBD+FKTa45lbOiB5n5W6GKzb0r3a3QxYs2in9jrs5wa+RjU1SVKWFr6/Xx4RG/1YRlhtQypIAfi8dvVKhQ3bspsHLqk7qYh06byILNu/Wv0b71T4vM/A5d/AJCYX1gAAABGSURBVEhLY2RgYPjPMEgA46hjcMQESsj8/0//GGNkBDkBAkYdgxxLoyGDq/QYDZnRkCG1ZhlNM0M7zZAa39RWP9qEwBWiAFdKNgHjKh/JAAAAAElFTkSuQmCC",
                                             "label": "RootFeature",
                                             "width": 100,
                                             "design": "shape=RootFeature;",
                                             "height": 50
                                           },
                                           "AbstractFeature": {
                                             "draw": "PHNoYXBlIG5hbWU9IlJvb3RGZWF0dXJlIiBhc3BlY3Q9InZhcmlhYmxlIiBzdHJva2V3aWR0aD0iaW5oZXJpdCI+Cgk8YmFja2dyb3VuZD4KICAgICAgICAgICAgICAgIDxzdHJva2V3aWR0aCB3aWR0aD0iNSIvPgoJCTxzdHJva2Vjb2xvciBjb2xvcj0iIzQ0NmU3OSIvPgoJCTxmaWxsY29sb3IgY29sb3I9IiNmZmZmZmYiLz4KCQk8cGF0aD4KCQkJPG1vdmUgeD0iMCIgeT0iMCIvPgoJCQk8bGluZSB4PSIxMDAiIHk9IjAiLz4KCQkJPGxpbmUgeD0iMTAwIiB5PSIxMDAiLz4KCQkJPGxpbmUgeD0iMCIgeT0iMTAwIi8+CgkJCTxsaW5lIHg9IjAiIHk9IjAiLz4KCQkJPGNsb3NlLz4gCgkJPC9wYXRoPgkKICAgICAgICAgICAgICAgIDxkYXNocGF0dGVybiBwYXR0ZXJuPSIzIDMiLz4KICAgICAgICAgICAgICAgIDxkYXNoZWQgZGFzaGVkPSIxIi8+CQoJPC9iYWNrZ3JvdW5kPgoJPGZvcmVncm91bmQ+CgkJPGZpbGxzdHJva2UvPgoJPC9mb3JlZ3JvdW5kPgo8L3NoYXBlPg==",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAACIAAAARCAYAAAC4qX7BAAACanpUWHRteEdyYXBoTW9kZWwAAE1Ty7KiMBD9GqpmFpeCBAGXIBcFREVe6i4IQjQQBAHl6ycMd6pmk+70Od3pnE44uCrfN0wyDgglTfENZykHDQ4AIIjLL0H6AmIgShzURJktgsoDVb4wmPEL2r5m7jAMfNqggcd0hlCeVT+YS0dMCOKAueAFBv2KcZXSoWXuLmCLKLAw1JnHAFma3bcs/WZGq2uSxVni4NeUDxUeylMJZxO4Ww6smE/wY+p9nV0fdEpZFQ0tWcRUIC8wugp5UYAM8NENNfi/MlOffda0mFZzp6wTmYczkL1QPkdl1Fl2tr5E4HzoCDHexhjMnNenzmZOTmk+SQg4+M3BVYpR3qCSUfCPmLC7pp6wUHLNoYdF4sf+U5jp94u9S1Q3Nyymqmmk13qFALgq+67jgP4JB1VqM20dSRb27LTsN59qT+Ta6T7GCNwE4Hd1YJfRN/jouMyGll3EvrV5k+WFNML1Uen7szXmg6Ueo29li3dWZB7oabVxcHVJPCW3lrRfy+Dq+s355CuLYjD61xIYGbql0TraaBtMnPMk6bOuo6sg3k3Wqh701G9BJEieepIdNcolxWecsI0pzuJ2PIRr3BTukVFzFscXNR0KtinvkTcsyrCK4u0eLQ83rdsG3cAod9WOw1H6Ruj+RI/+oEofqCHdCRYsz9x5jYJMejTIglWZtOpzn9xKqG/zJZGLZWo2d2OPvaemjpqaGHZ6nA7e6iY2UuBa9OyR4pjU+1OHg6w53SbVwi6tmV2dQxvQ4zM7PSNbx49P9U7FZHosu7bfjVCdxgjZezP/zfbvoNn+5/fA7z/3hjkcAAAASklEQVRIS2Osr6//39jYyDDQgHHQOaS+vp6hoaGB7gEDig2QvfAQGXXIaIigpcLRNIKeLUdDZDRECBXVo2mEYBohFIS0lh80zQAAUCGSAY7rsksAAAAASUVORK5CYII=",
                                             "label": "AbstractFeature",
                                             "width": 100,
                                             "height": 50
                                           },
                                           "ConcreteFeature": {
                                             "draw": "PHNoYXBlIG5hbWU9IlJvb3RGZWF0dXJlIiBhc3BlY3Q9InZhcmlhYmxlIiBzdHJva2V3aWR0aD0iNyI+DQoJPGJhY2tncm91bmQ+DQoJCTxzdHJva2Vjb2xvciBjb2xvcj0iIzQ0NmU3OSIvPg0KCQk8ZmlsbGNvbG9yIGNvbG9yPSIjZmZmZmZmIi8+DQoJCTxwYXRoPg0KCQkJPG1vdmUgeD0iMCIgeT0iMCIvPg0KCQkJPGxpbmUgeD0iMTAwIiB5PSIwIi8+DQoJCQk8bGluZSB4PSIxMDAiIHk9IjEwMCIvPg0KCQkJPGxpbmUgeD0iMCIgeT0iMTAwIi8+DQoJCQk8bGluZSB4PSIwIiB5PSIwIi8+DQoJCQk8Y2xvc2UvPiANCgkJPC9wYXRoPgkJDQoJPC9iYWNrZ3JvdW5kPg0KCTxmb3JlZ3JvdW5kPg0KCQk8ZmlsbHN0cm9rZS8+DQoJPC9mb3JlZ3JvdW5kPg0KPC9zaGFwZT4=",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAACEAAAAQCAYAAACYwhZnAAAAR0lEQVRIS+2VMQoAMAgDk5dHX57SQpdCZ5f4AcNxGkoyhocALGksRnfjhLDnYJBMiKNASNxLCImQeL9inIgTXyeqaqxF9+4FTfM+fusqx+IAAAAASUVORK5CYII=",
                                             "label": "ConcreteFeature",
                                             "width": 100,
                                             "design": "shape=ConcreteFeature;",
                                             "height": 50
                                           }
                                         },
                                         "relationships": {
                                           "Bundle_Feature": {
                                             "styles": [
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=none;"
                                               }
                                             ],
                                             "label_property": "Type"
                                           },
                                           "RootFeature_Feature": {
                                             "styles": [
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=1;endSize=12;",
                                                 "linked_value": "Mandatory",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=0;endSize=12;",
                                                 "linked_value": "Optional",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=open;",
                                                 "linked_value": "Includes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;startArrow=open;endArrow=open;",
                                                 "linked_value": "Excludes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=none;",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;"
                                               }
                                             ],
                                             "label_property": "Type"
                                           },
                                           "AbstractFeature_Feature": {
                                             "styles": [
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=1;endSize=12;",
                                                 "linked_value": "Mandatory",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=0;endSize=12;",
                                                 "linked_value": "Optional",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=open;",
                                                 "linked_value": "Includes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;startArrow=open;endArrow=open;",
                                                 "linked_value": "Excludes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=none;",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;"
                                               }
                                             ],
                                             "label_property": "Type"
                                           },
                                           "ConcreteFeature_Feature": {
                                             "styles": [
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=1;endSize=12;",
                                                 "linked_value": "Mandatory",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=0;endSize=12;",
                                                 "linked_value": "Optional",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=open;",
                                                 "linked_value": "Includes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;startArrow=open;endArrow=open;",
                                                 "linked_value": "Excludes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=none;",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;"
                                               }
                                             ],
                                             "label_property": "Type"
                                           }
                                         }
                                       },
                                       "type": "DOMAIN",
                                       "stateAccept": "ACTIVE"
                                     },
                                     {
                                       "id": 102,
                                       "name": "istar2",
                                       "abstractSyntax": {
                                         "elements": {
                                           "Goal": {
                                             "properties": [
                                               {
                                                 "name": "Selected",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "Undefined,Selected,Unselected"
                                               }
                                             ]
                                           },
                                           "Bundle": {
                                             "properties": [
                                               {
                                                 "name": "Type",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "And,Or,Xor,Range"
                                               },
                                               {
                                                 "name": "RangeMin",
                                                 "type": "String",
                                                 "linked_value": "Range",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "RangeMax",
                                                 "type": "String",
                                                 "linked_value": "Range",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "Testing",
                                                 "type": "Integer",
                                                 "comment": "prueba",
                                                 "possibleValues": "1..10"
                                               }
                                             ]
                                           },
                                           "RootFeature": {
                                             "properties": [
                                               {
                                                 "name": "Selected",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "Undefined,Selected,Unselected"
                                               }
                                             ]
                                           },
                                           "AbstractFeature": {
                                             "properties": [
                                               {
                                                 "name": "Selected",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "Undefined,Selected,Unselected"
                                               }
                                             ]
                                           },
                                           "ConcreteFeature": {
                                             "properties": [
                                               {
                                                 "name": "Selected",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "Undefined,Selected,Unselected"
                                               }
                                             ]
                                           }
                                         },
                                         "restrictions": {
                                           "quantity_element": [
                                             {
                                               "max": 2,
                                               "min": 3,
                                               "element": "RootFeatureForTest"
                                             }
                                           ]
                                         },
                                         "relationships": {
                                           "Bundle_Feature": {
                                             "max": 9999999,
                                             "min": 1,
                                             "source": "Bundle",
                                             "target": [
                                               "AbstractFeature",
                                               "ConcreteFeature"
                                             ],
                                             "properties": []
                                           },
                                           "RootFeature_Feature": {
                                             "max": 9999999,
                                             "min": 1,
                                             "source": "RootFeature",
                                             "target": [
                                               "AbstractFeature",
                                               "ConcreteFeature",
                                               "Bundle"
                                             ],
                                             "properties": [
                                               {
                                                 "name": "Type",
                                                 "type": "String",
                                                 "possibleValues": "Mandatory,Optional,Includes,Excludes,IndividualCardinality"
                                               },
                                               {
                                                 "name": "MinValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "MaxValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               }
                                             ]
                                           },
                                           "AbstractFeature_Feature": {
                                             "max": 9999999,
                                             "min": 1,
                                             "source": "AbstractFeature",
                                             "target": [
                                               "AbstractFeature",
                                               "ConcreteFeature",
                                               "Bundle"
                                             ],
                                             "properties": [
                                               {
                                                 "name": "Type",
                                                 "type": "String",
                                                 "possibleValues": "Mandatory,Optional,Includes,Excludes,IndividualCardinality"
                                               },
                                               {
                                                 "name": "MinValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "MaxValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               }
                                             ]
                                           },
                                           "ConcreteFeature_Feature": {
                                             "max": 9999999,
                                             "min": 1,
                                             "source": "ConcreteFeature",
                                             "target": [
                                               "AbstractFeature",
                                               "ConcreteFeature",
                                               "Bundle"
                                             ],
                                             "properties": [
                                               {
                                                 "name": "Type",
                                                 "type": "String",
                                                 "possibleValues": "Mandatory,Optional,Includes,Excludes,IndividualCardinality"
                                               },
                                               {
                                                 "name": "MinValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "MaxValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               }
                                             ]
                                           }
                                         }
                                       },
                                       "concreteSyntax": {
                                         "elements": {
                                           "Goal": {
                                             "draw": "PHNoYXBlIG5hbWU9IlJvb3RGZWF0dXJlIiBhc3BlY3Q9InZhcmlhYmxlIiBzdHJva2V3aWR0aD0iNyI+DQoJPGJhY2tncm91bmQ+DQoJCTxzdHJva2Vjb2xvciBjb2xvcj0iIzQ0NmU3OSIvPg0KCQk8ZmlsbGNvbG9yIGNvbG9yPSIjZmZmZmZmIi8+DQoJCTxwYXRoPg0KCQkJPG1vdmUgeD0iMCIgeT0iMCIvPg0KCQkJPGxpbmUgeD0iMTAwIiB5PSIwIi8+DQoJCQk8bGluZSB4PSIxMDAiIHk9IjEwMCIvPg0KCQkJPGxpbmUgeD0iMCIgeT0iMTAwIi8+DQoJCQk8bGluZSB4PSIwIiB5PSIwIi8+DQoJCQk8Y2xvc2UvPiANCgkJPC9wYXRoPgkJDQoJPC9iYWNrZ3JvdW5kPg0KCTxmb3JlZ3JvdW5kPg0KCQk8ZmlsbHN0cm9rZS8+DQoJPC9mb3JlZ3JvdW5kPg0KPC9zaGFwZT4=",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAACEAAAAQCAYAAACYwhZnAAAAR0lEQVRIS+2VMQoAMAgDk5dHX57SQpdCZ5f4AcNxGkoyhocALGksRnfjhLDnYJBMiKNASNxLCImQeL9inIgTXyeqaqxF9+4FTfM+fusqx+IAAAAASUVORK5CYII=",
                                             "label": "Goal1",
                                             "width": 100,
                                             "design": "shape=ConcreteFeature;",
                                             "height": 50
                                           },
                                           "Bundle": {
                                             "draw": "PHNoYXBlIG5hbWU9ImNvbXBvbmVudCIgYXNwZWN0PSJmaXhlZCIgc3Ryb2tld2lkdGg9IjIiPgoJPGJhY2tncm91bmQ+CgkJPHN0cm9rZWNvbG9yIGNvbG9yPSIjNDQ2ZTc5Ii8+CgkJPGZpbGxjb2xvciBjb2xvcj0iI2ZmZmZmZiIvPgoJCTxwYXRoPiAKCQkJPGVsbGlwc2UgeD0iMCIgeT0iMCIgdz0iMTAwIiBoPSIxMDAiLz4gCgkJPC9wYXRoPgkJCgk8L2JhY2tncm91bmQ+Cgk8Zm9yZWdyb3VuZD4KCQk8ZmlsbHN0cm9rZS8+Cgk8L2ZvcmVncm91bmQ+Cjwvc2hhcGU+",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAACE0lEQVRIS7WVv6v5YRTH3zaL3wYDizLIxMBCyT+AJJNEWCkpBjuDYiKUSULiL/BjU4qESUhsfkRZTG7PR1yuz/12fd17xuc5z+v8es45jPP5fAaNbDYbhMNhVKtVsFgsKJVK6PV6tFot9Pt9HI9HWCwWRKNR8Pn8JwKDDpxOpxGJRFCr1aBQKMDj8Z4e7nY7jMdjmEwmCu7xeB50nsBmsxkikQipVIouENozr9eLw+GAUql0u38AEygJ1+fz/Rh6VYzH4+h0OqhUKtTRDUzCHwwGL3n61TpJh0ajgdvtvoBJoeRyOdbr9cuefn1A6jGfzy9gYsnhcECr1b4NbrfbKBaLFzD5LtPplLb6r1q6Rs9YLBZnnU6HxWLxKuNbfYlEAka9Xj/n83nU6/VfAxuNRjASiQTVI36//9fAyWTyDz3+sxyTPAgEAkwmE9ph8mp+SC+Q+UJ9N9Lrdrsd5He8K81mE+Vy+QImk0omk2G73b7LBYfDwXK5/JwV2WwW3W4XmUzmv+Eul4uK2ul0foIJzWazQa1WIxAIvAwnM3k4HKJQKDxOtyvJarWCy+WCRPBTIZ6eTqcb9GFs3kNyuRyCwSDVjaTCQqHwyQap/mg0ojZIIpGgwr8X2tVEFPb7PUKhELXzmEwmVCoVDAYDGo0Ger0e5SHZebFYDGw2+8nwt+B7zdVqRcFmsxmkUillRCwW/zNTH/HNGKNltOpYAAAAAElFTkSuQmCC",
                                             "label": "Bundle",
                                             "width": 100,
                                             "design": "shape=Bundle",
                                             "height": 50,
                                             "label_property": "Type"
                                           },
                                           "RootFeature": {
                                             "draw": "PHNoYXBlIG5hbWU9IlJvb3RGZWF0dXJlIiBhc3BlY3Q9InZhcmlhYmxlIiBzdHJva2V3aWR0aD0iMTEiPg0KCTxiYWNrZ3JvdW5kPg0KCQk8c3Ryb2tlY29sb3IgY29sb3I9IiM0NDZlNzkiLz4NCgkJPGZpbGxjb2xvciBjb2xvcj0iI2ZmZmZmZiIvPg0KCQk8cGF0aD4NCgkJCTxtb3ZlIHg9IjAiIHk9IjAiLz4NCgkJCTxsaW5lIHg9IjEwMCIgeT0iMCIvPg0KCQkJPGxpbmUgeD0iMTAwIiB5PSIxMDAiLz4NCgkJCTxsaW5lIHg9IjAiIHk9IjEwMCIvPg0KCQkJPGxpbmUgeD0iMCIgeT0iMCIvPg0KCQkJPGNsb3NlLz4gDQoJCTwvcGF0aD4JCQ0KCTwvYmFja2dyb3VuZD4NCgk8Zm9yZWdyb3VuZD4NCgkJPGZpbGxzdHJva2UvPg0KCTwvZm9yZWdyb3VuZD4NCjwvc2hhcGU+",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAACMAAAASCAYAAADR/2dRAAACY3pUWHRteEdyYXBoTW9kZWwAAE1Ty7KiMBT8GqpmFpcKBAIueQiCTxTUyw4kYJRnQEG+fsJwp2o2yanuPqmubuCgUQwpyTEngqJKSEpwwkGTE0URCIsvIH2Jgi9IHNQExA4g8kAEIaOZ/l613azt+55PaNTzpJqpKMPlD7etRpLnESdaMg8Y9etCyqTqWzbufHYIgMFQZxMjkDSPA5J+s0ur6xxfcLwm3bQPFR6i6Yn1yt9uONFgc06ek3cb357VtGLcaVUwxFIgD5hchbwAICNOURpR8t8zk883pi2pytkpc4J4OBO4i7IZhXZ5vRmPMUgM+XTsS4eo5azpPjWeNVlVZVOEIgeXHDQSEmU0KpiE/IS5WA3hCWlf6/aN81ebyd/ZepY/QmcRq15mOixVy7y2J6Xx9/6UVwdIboYDvWWOkhFXK1CkvvdBz4l6Yja1Ma4P8eXDhMXB/pQJuqGdtzo9jPaz95dMpLWUNIlvtZI16vaNIWZhDMUzDGKkn96q4QUyAPoGeUhf7VguR4E8urOpaMNhL12zLdsA4Uh3jau/ZO3sdaM/MkxYONTeF7c47dOksTx5VB+ji2sqQaM/T1vkju/18drYXtnmriMpA6tK3+a9cjyiV8I8bppnMRSHFPWbl6hsTdaH9fGCLbZWhWMXNVXU0j5Jpudu0m0sqYiAO6r8BXaSXlFXdTnQnoBD+FKTa45lbOiB5n5W6GKzb0r3a3QxYs2in9jrs5wa+RjU1SVKWFr6/Xx4RG/1YRlhtQypIAfi8dvVKhQ3bspsHLqk7qYh06byILNu/Wv0b71T4vM/A5d/AJCYX1gAAABGSURBVEhLY2RgYPjPMEgA46hjcMQESsj8/0//GGNkBDkBAkYdgxxLoyGDq/QYDZnRkCG1ZhlNM0M7zZAa39RWP9qEwBWiAFdKNgHjKh/JAAAAAElFTkSuQmCC",
                                             "label": "RootFeature",
                                             "width": 100,
                                             "design": "shape=RootFeature;",
                                             "height": 50
                                           },
                                           "AbstractFeature": {
                                             "draw": "PHNoYXBlIG5hbWU9IlJvb3RGZWF0dXJlIiBhc3BlY3Q9InZhcmlhYmxlIiBzdHJva2V3aWR0aD0iaW5oZXJpdCI+Cgk8YmFja2dyb3VuZD4KICAgICAgICAgICAgICAgIDxzdHJva2V3aWR0aCB3aWR0aD0iNSIvPgoJCTxzdHJva2Vjb2xvciBjb2xvcj0iIzQ0NmU3OSIvPgoJCTxmaWxsY29sb3IgY29sb3I9IiNmZmZmZmYiLz4KCQk8cGF0aD4KCQkJPG1vdmUgeD0iMCIgeT0iMCIvPgoJCQk8bGluZSB4PSIxMDAiIHk9IjAiLz4KCQkJPGxpbmUgeD0iMTAwIiB5PSIxMDAiLz4KCQkJPGxpbmUgeD0iMCIgeT0iMTAwIi8+CgkJCTxsaW5lIHg9IjAiIHk9IjAiLz4KCQkJPGNsb3NlLz4gCgkJPC9wYXRoPgkKICAgICAgICAgICAgICAgIDxkYXNocGF0dGVybiBwYXR0ZXJuPSIzIDMiLz4KICAgICAgICAgICAgICAgIDxkYXNoZWQgZGFzaGVkPSIxIi8+CQoJPC9iYWNrZ3JvdW5kPgoJPGZvcmVncm91bmQ+CgkJPGZpbGxzdHJva2UvPgoJPC9mb3JlZ3JvdW5kPgo8L3NoYXBlPg==",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAACIAAAARCAYAAAC4qX7BAAACanpUWHRteEdyYXBoTW9kZWwAAE1Ty7KiMBD9GqpmFpeCBAGXIBcFREVe6i4IQjQQBAHl6ycMd6pmk+70Od3pnE44uCrfN0wyDgglTfENZykHDQ4AIIjLL0H6AmIgShzURJktgsoDVb4wmPEL2r5m7jAMfNqggcd0hlCeVT+YS0dMCOKAueAFBv2KcZXSoWXuLmCLKLAw1JnHAFma3bcs/WZGq2uSxVni4NeUDxUeylMJZxO4Ww6smE/wY+p9nV0fdEpZFQ0tWcRUIC8wugp5UYAM8NENNfi/MlOffda0mFZzp6wTmYczkL1QPkdl1Fl2tr5E4HzoCDHexhjMnNenzmZOTmk+SQg4+M3BVYpR3qCSUfCPmLC7pp6wUHLNoYdF4sf+U5jp94u9S1Q3Nyymqmmk13qFALgq+67jgP4JB1VqM20dSRb27LTsN59qT+Ta6T7GCNwE4Hd1YJfRN/jouMyGll3EvrV5k+WFNML1Uen7szXmg6Ueo29li3dWZB7oabVxcHVJPCW3lrRfy+Dq+s355CuLYjD61xIYGbql0TraaBtMnPMk6bOuo6sg3k3Wqh701G9BJEieepIdNcolxWecsI0pzuJ2PIRr3BTukVFzFscXNR0KtinvkTcsyrCK4u0eLQ83rdsG3cAod9WOw1H6Ruj+RI/+oEofqCHdCRYsz9x5jYJMejTIglWZtOpzn9xKqG/zJZGLZWo2d2OPvaemjpqaGHZ6nA7e6iY2UuBa9OyR4pjU+1OHg6w53SbVwi6tmV2dQxvQ4zM7PSNbx49P9U7FZHosu7bfjVCdxgjZezP/zfbvoNn+5/fA7z/3hjkcAAAASklEQVRIS2Osr6//39jYyDDQgHHQOaS+vp6hoaGB7gEDig2QvfAQGXXIaIigpcLRNIKeLUdDZDRECBXVo2mEYBohFIS0lh80zQAAUCGSAY7rsksAAAAASUVORK5CYII=",
                                             "label": "AbstractFeature",
                                             "width": 100,
                                             "height": 50
                                           },
                                           "ConcreteFeature": {
                                             "draw": "PHNoYXBlIG5hbWU9IlJvb3RGZWF0dXJlIiBhc3BlY3Q9InZhcmlhYmxlIiBzdHJva2V3aWR0aD0iNyI+DQoJPGJhY2tncm91bmQ+DQoJCTxzdHJva2Vjb2xvciBjb2xvcj0iIzQ0NmU3OSIvPg0KCQk8ZmlsbGNvbG9yIGNvbG9yPSIjZmZmZmZmIi8+DQoJCTxwYXRoPg0KCQkJPG1vdmUgeD0iMCIgeT0iMCIvPg0KCQkJPGxpbmUgeD0iMTAwIiB5PSIwIi8+DQoJCQk8bGluZSB4PSIxMDAiIHk9IjEwMCIvPg0KCQkJPGxpbmUgeD0iMCIgeT0iMTAwIi8+DQoJCQk8bGluZSB4PSIwIiB5PSIwIi8+DQoJCQk8Y2xvc2UvPiANCgkJPC9wYXRoPgkJDQoJPC9iYWNrZ3JvdW5kPg0KCTxmb3JlZ3JvdW5kPg0KCQk8ZmlsbHN0cm9rZS8+DQoJPC9mb3JlZ3JvdW5kPg0KPC9zaGFwZT4=",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAACEAAAAQCAYAAACYwhZnAAAAR0lEQVRIS+2VMQoAMAgDk5dHX57SQpdCZ5f4AcNxGkoyhocALGksRnfjhLDnYJBMiKNASNxLCImQeL9inIgTXyeqaqxF9+4FTfM+fusqx+IAAAAASUVORK5CYII=",
                                             "label": "ConcreteFeature",
                                             "width": 100,
                                             "design": "shape=ConcreteFeature;",
                                             "height": 50
                                           }
                                         },
                                         "relationships": {
                                           "Bundle_Feature": {
                                             "styles": [
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=none;"
                                               }
                                             ],
                                             "label_property": "Type"
                                           },
                                           "RootFeature_Feature": {
                                             "styles": [
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=1;endSize=12;",
                                                 "linked_value": "Mandatory",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=0;endSize=12;",
                                                 "linked_value": "Optional",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=open;",
                                                 "linked_value": "Includes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;startArrow=open;endArrow=open;",
                                                 "linked_value": "Excludes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=none;",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;"
                                               }
                                             ],
                                             "label_property": "Type"
                                           },
                                           "AbstractFeature_Feature": {
                                             "styles": [
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=1;endSize=12;",
                                                 "linked_value": "Mandatory",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=0;endSize=12;",
                                                 "linked_value": "Optional",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=open;",
                                                 "linked_value": "Includes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;startArrow=open;endArrow=open;",
                                                 "linked_value": "Excludes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=none;",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;"
                                               }
                                             ],
                                             "label_property": "Type"
                                           },
                                           "ConcreteFeature_Feature": {
                                             "styles": [
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=1;endSize=12;",
                                                 "linked_value": "Mandatory",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=0;endSize=12;",
                                                 "linked_value": "Optional",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=open;",
                                                 "linked_value": "Includes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;startArrow=open;endArrow=open;",
                                                 "linked_value": "Excludes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=none;",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;"
                                               }
                                             ],
                                             "label_property": "Type"
                                           }
                                         }
                                       },
                                       "type": "DOMAIN",
                                       "stateAccept": "ACTIVE"
                                     },
                                     {
                                       "id": 101,
                                       "name": "istar3",
                                       "abstractSyntax": {
                                         "elements": {
                                           "Goal": {
                                             "properties": [
                                               {
                                                 "name": "Selected",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "Undefined,Selected,Unselected"
                                               }
                                             ]
                                           },
                                           "Bundle": {
                                             "properties": [
                                               {
                                                 "name": "Type",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "And,Or,Xor,Range"
                                               },
                                               {
                                                 "name": "RangeMin",
                                                 "type": "String",
                                                 "linked_value": "Range",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "RangeMax",
                                                 "type": "String",
                                                 "linked_value": "Range",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "Testing",
                                                 "type": "Integer",
                                                 "comment": "prueba",
                                                 "possibleValues": "1..10"
                                               }
                                             ]
                                           },
                                           "RootFeature": {
                                             "properties": [
                                               {
                                                 "name": "Selected",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "Undefined,Selected,Unselected"
                                               }
                                             ]
                                           },
                                           "AbstractFeature": {
                                             "properties": [
                                               {
                                                 "name": "Selected",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "Undefined,Selected,Unselected"
                                               }
                                             ]
                                           },
                                           "ConcreteFeature": {
                                             "properties": [
                                               {
                                                 "name": "Selected",
                                                 "type": "String",
                                                 "comment": "type options",
                                                 "possibleValues": "Undefined,Selected,Unselected"
                                               }
                                             ]
                                           }
                                         },
                                         "restrictions": {},
                                         "relationships": {
                                           "Bundle_Feature": {
                                             "max": 9999999,
                                             "min": 1,
                                             "source": "Bundle",
                                             "target": [
                                               "AbstractFeature",
                                               "ConcreteFeature"
                                             ],
                                             "properties": []
                                           },
                                           "RootFeature_Feature": {
                                             "max": 9999999,
                                             "min": 1,
                                             "source": "RootFeature",
                                             "target": [
                                               "AbstractFeature",
                                               "ConcreteFeature",
                                               "Bundle"
                                             ],
                                             "properties": [
                                               {
                                                 "name": "Type",
                                                 "type": "String",
                                                 "possibleValues": "Mandatory,Optional,Includes,Excludes,IndividualCardinality"
                                               },
                                               {
                                                 "name": "MinValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "MaxValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               }
                                             ]
                                           },
                                           "AbstractFeature_Feature": {
                                             "max": 9999999,
                                             "min": 1,
                                             "source": "AbstractFeature",
                                             "target": [
                                               "AbstractFeature",
                                               "ConcreteFeature",
                                               "Bundle"
                                             ],
                                             "properties": [
                                               {
                                                 "name": "Type",
                                                 "type": "String",
                                                 "possibleValues": "Mandatory,Optional,Includes,Excludes,IndividualCardinality"
                                               },
                                               {
                                                 "name": "MinValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "MaxValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               }
                                             ]
                                           },
                                           "ConcreteFeature_Feature": {
                                             "max": 9999999,
                                             "min": 1,
                                             "source": "ConcreteFeature",
                                             "target": [
                                               "AbstractFeature",
                                               "ConcreteFeature",
                                               "Bundle"
                                             ],
                                             "properties": [
                                               {
                                                 "name": "Type",
                                                 "type": "String",
                                                 "possibleValues": "Mandatory,Optional,Includes,Excludes,IndividualCardinality"
                                               },
                                               {
                                                 "name": "MinValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "name": "MaxValue",
                                                 "type": "String",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               }
                                             ]
                                           }
                                         }
                                       },
                                       "concreteSyntax": {
                                         "elements": {
                                           "Goal": {
                                             "draw": "PHNoYXBlIG5hbWU9IlJvb3RGZWF0dXJlIiBhc3BlY3Q9InZhcmlhYmxlIiBzdHJva2V3aWR0aD0iNyI+DQoJPGJhY2tncm91bmQ+DQoJCTxzdHJva2Vjb2xvciBjb2xvcj0iIzQ0NmU3OSIvPg0KCQk8ZmlsbGNvbG9yIGNvbG9yPSIjZmZmZmZmIi8+DQoJCTxwYXRoPg0KCQkJPG1vdmUgeD0iMCIgeT0iMCIvPg0KCQkJPGxpbmUgeD0iMTAwIiB5PSIwIi8+DQoJCQk8bGluZSB4PSIxMDAiIHk9IjEwMCIvPg0KCQkJPGxpbmUgeD0iMCIgeT0iMTAwIi8+DQoJCQk8bGluZSB4PSIwIiB5PSIwIi8+DQoJCQk8Y2xvc2UvPiANCgkJPC9wYXRoPgkJDQoJPC9iYWNrZ3JvdW5kPg0KCTxmb3JlZ3JvdW5kPg0KCQk8ZmlsbHN0cm9rZS8+DQoJPC9mb3JlZ3JvdW5kPg0KPC9zaGFwZT4=",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAACEAAAAQCAYAAACYwhZnAAAAR0lEQVRIS+2VMQoAMAgDk5dHX57SQpdCZ5f4AcNxGkoyhocALGksRnfjhLDnYJBMiKNASNxLCImQeL9inIgTXyeqaqxF9+4FTfM+fusqx+IAAAAASUVORK5CYII=",
                                             "label": "Goal1",
                                             "width": 100,
                                             "design": "shape=ConcreteFeature;",
                                             "height": 50
                                           },
                                           "Bundle": {
                                             "draw": "PHNoYXBlIG5hbWU9ImNvbXBvbmVudCIgYXNwZWN0PSJmaXhlZCIgc3Ryb2tld2lkdGg9IjIiPgoJPGJhY2tncm91bmQ+CgkJPHN0cm9rZWNvbG9yIGNvbG9yPSIjNDQ2ZTc5Ii8+CgkJPGZpbGxjb2xvciBjb2xvcj0iI2ZmZmZmZiIvPgoJCTxwYXRoPiAKCQkJPGVsbGlwc2UgeD0iMCIgeT0iMCIgdz0iMTAwIiBoPSIxMDAiLz4gCgkJPC9wYXRoPgkJCgk8L2JhY2tncm91bmQ+Cgk8Zm9yZWdyb3VuZD4KCQk8ZmlsbHN0cm9rZS8+Cgk8L2ZvcmVncm91bmQ+Cjwvc2hhcGU+",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAACE0lEQVRIS7WVv6v5YRTH3zaL3wYDizLIxMBCyT+AJJNEWCkpBjuDYiKUSULiL/BjU4qESUhsfkRZTG7PR1yuz/12fd17xuc5z+v8es45jPP5fAaNbDYbhMNhVKtVsFgsKJVK6PV6tFot9Pt9HI9HWCwWRKNR8Pn8JwKDDpxOpxGJRFCr1aBQKMDj8Z4e7nY7jMdjmEwmCu7xeB50nsBmsxkikQipVIouENozr9eLw+GAUql0u38AEygJ1+fz/Rh6VYzH4+h0OqhUKtTRDUzCHwwGL3n61TpJh0ajgdvtvoBJoeRyOdbr9cuefn1A6jGfzy9gYsnhcECr1b4NbrfbKBaLFzD5LtPplLb6r1q6Rs9YLBZnnU6HxWLxKuNbfYlEAka9Xj/n83nU6/VfAxuNRjASiQTVI36//9fAyWTyDz3+sxyTPAgEAkwmE9ph8mp+SC+Q+UJ9N9Lrdrsd5He8K81mE+Vy+QImk0omk2G73b7LBYfDwXK5/JwV2WwW3W4XmUzmv+Eul4uK2ul0foIJzWazQa1WIxAIvAwnM3k4HKJQKDxOtyvJarWCy+WCRPBTIZ6eTqcb9GFs3kNyuRyCwSDVjaTCQqHwyQap/mg0ojZIIpGgwr8X2tVEFPb7PUKhELXzmEwmVCoVDAYDGo0Ger0e5SHZebFYDGw2+8nwt+B7zdVqRcFmsxmkUillRCwW/zNTH/HNGKNltOpYAAAAAElFTkSuQmCC",
                                             "label": "Bundle",
                                             "width": 100,
                                             "design": "shape=Bundle",
                                             "height": 50,
                                             "label_property": "Type"
                                           },
                                           "RootFeature": {
                                             "draw": "PHNoYXBlIG5hbWU9IlJvb3RGZWF0dXJlIiBhc3BlY3Q9InZhcmlhYmxlIiBzdHJva2V3aWR0aD0iMTEiPg0KCTxiYWNrZ3JvdW5kPg0KCQk8c3Ryb2tlY29sb3IgY29sb3I9IiM0NDZlNzkiLz4NCgkJPGZpbGxjb2xvciBjb2xvcj0iI2ZmZmZmZiIvPg0KCQk8cGF0aD4NCgkJCTxtb3ZlIHg9IjAiIHk9IjAiLz4NCgkJCTxsaW5lIHg9IjEwMCIgeT0iMCIvPg0KCQkJPGxpbmUgeD0iMTAwIiB5PSIxMDAiLz4NCgkJCTxsaW5lIHg9IjAiIHk9IjEwMCIvPg0KCQkJPGxpbmUgeD0iMCIgeT0iMCIvPg0KCQkJPGNsb3NlLz4gDQoJCTwvcGF0aD4JCQ0KCTwvYmFja2dyb3VuZD4NCgk8Zm9yZWdyb3VuZD4NCgkJPGZpbGxzdHJva2UvPg0KCTwvZm9yZWdyb3VuZD4NCjwvc2hhcGU+",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAACMAAAASCAYAAADR/2dRAAACY3pUWHRteEdyYXBoTW9kZWwAAE1Ty7KiMBT8GqpmFpcKBAIueQiCTxTUyw4kYJRnQEG+fsJwp2o2yanuPqmubuCgUQwpyTEngqJKSEpwwkGTE0URCIsvIH2Jgi9IHNQExA4g8kAEIaOZ/l613azt+55PaNTzpJqpKMPlD7etRpLnESdaMg8Y9etCyqTqWzbufHYIgMFQZxMjkDSPA5J+s0ur6xxfcLwm3bQPFR6i6Yn1yt9uONFgc06ek3cb357VtGLcaVUwxFIgD5hchbwAICNOURpR8t8zk883pi2pytkpc4J4OBO4i7IZhXZ5vRmPMUgM+XTsS4eo5azpPjWeNVlVZVOEIgeXHDQSEmU0KpiE/IS5WA3hCWlf6/aN81ebyd/ZepY/QmcRq15mOixVy7y2J6Xx9/6UVwdIboYDvWWOkhFXK1CkvvdBz4l6Yja1Ma4P8eXDhMXB/pQJuqGdtzo9jPaz95dMpLWUNIlvtZI16vaNIWZhDMUzDGKkn96q4QUyAPoGeUhf7VguR4E8urOpaMNhL12zLdsA4Uh3jau/ZO3sdaM/MkxYONTeF7c47dOksTx5VB+ji2sqQaM/T1vkju/18drYXtnmriMpA6tK3+a9cjyiV8I8bppnMRSHFPWbl6hsTdaH9fGCLbZWhWMXNVXU0j5Jpudu0m0sqYiAO6r8BXaSXlFXdTnQnoBD+FKTa45lbOiB5n5W6GKzb0r3a3QxYs2in9jrs5wa+RjU1SVKWFr6/Xx4RG/1YRlhtQypIAfi8dvVKhQ3bspsHLqk7qYh06byILNu/Wv0b71T4vM/A5d/AJCYX1gAAABGSURBVEhLY2RgYPjPMEgA46hjcMQESsj8/0//GGNkBDkBAkYdgxxLoyGDq/QYDZnRkCG1ZhlNM0M7zZAa39RWP9qEwBWiAFdKNgHjKh/JAAAAAElFTkSuQmCC",
                                             "label": "RootFeature",
                                             "width": 100,
                                             "design": "shape=RootFeature;",
                                             "height": 50
                                           },
                                           "AbstractFeature": {
                                             "draw": "PHNoYXBlIG5hbWU9IlJvb3RGZWF0dXJlIiBhc3BlY3Q9InZhcmlhYmxlIiBzdHJva2V3aWR0aD0iaW5oZXJpdCI+Cgk8YmFja2dyb3VuZD4KICAgICAgICAgICAgICAgIDxzdHJva2V3aWR0aCB3aWR0aD0iNSIvPgoJCTxzdHJva2Vjb2xvciBjb2xvcj0iIzQ0NmU3OSIvPgoJCTxmaWxsY29sb3IgY29sb3I9IiNmZmZmZmYiLz4KCQk8cGF0aD4KCQkJPG1vdmUgeD0iMCIgeT0iMCIvPgoJCQk8bGluZSB4PSIxMDAiIHk9IjAiLz4KCQkJPGxpbmUgeD0iMTAwIiB5PSIxMDAiLz4KCQkJPGxpbmUgeD0iMCIgeT0iMTAwIi8+CgkJCTxsaW5lIHg9IjAiIHk9IjAiLz4KCQkJPGNsb3NlLz4gCgkJPC9wYXRoPgkKICAgICAgICAgICAgICAgIDxkYXNocGF0dGVybiBwYXR0ZXJuPSIzIDMiLz4KICAgICAgICAgICAgICAgIDxkYXNoZWQgZGFzaGVkPSIxIi8+CQoJPC9iYWNrZ3JvdW5kPgoJPGZvcmVncm91bmQ+CgkJPGZpbGxzdHJva2UvPgoJPC9mb3JlZ3JvdW5kPgo8L3NoYXBlPg==",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAACIAAAARCAYAAAC4qX7BAAACanpUWHRteEdyYXBoTW9kZWwAAE1Ty7KiMBD9GqpmFpeCBAGXIBcFREVe6i4IQjQQBAHl6ycMd6pmk+70Od3pnE44uCrfN0wyDgglTfENZykHDQ4AIIjLL0H6AmIgShzURJktgsoDVb4wmPEL2r5m7jAMfNqggcd0hlCeVT+YS0dMCOKAueAFBv2KcZXSoWXuLmCLKLAw1JnHAFma3bcs/WZGq2uSxVni4NeUDxUeylMJZxO4Ww6smE/wY+p9nV0fdEpZFQ0tWcRUIC8wugp5UYAM8NENNfi/MlOffda0mFZzp6wTmYczkL1QPkdl1Fl2tr5E4HzoCDHexhjMnNenzmZOTmk+SQg4+M3BVYpR3qCSUfCPmLC7pp6wUHLNoYdF4sf+U5jp94u9S1Q3Nyymqmmk13qFALgq+67jgP4JB1VqM20dSRb27LTsN59qT+Ta6T7GCNwE4Hd1YJfRN/jouMyGll3EvrV5k+WFNML1Uen7szXmg6Ueo29li3dWZB7oabVxcHVJPCW3lrRfy+Dq+s355CuLYjD61xIYGbql0TraaBtMnPMk6bOuo6sg3k3Wqh701G9BJEieepIdNcolxWecsI0pzuJ2PIRr3BTukVFzFscXNR0KtinvkTcsyrCK4u0eLQ83rdsG3cAod9WOw1H6Ruj+RI/+oEofqCHdCRYsz9x5jYJMejTIglWZtOpzn9xKqG/zJZGLZWo2d2OPvaemjpqaGHZ6nA7e6iY2UuBa9OyR4pjU+1OHg6w53SbVwi6tmV2dQxvQ4zM7PSNbx49P9U7FZHosu7bfjVCdxgjZezP/zfbvoNn+5/fA7z/3hjkcAAAASklEQVRIS2Osr6//39jYyDDQgHHQOaS+vp6hoaGB7gEDig2QvfAQGXXIaIigpcLRNIKeLUdDZDRECBXVo2mEYBohFIS0lh80zQAAUCGSAY7rsksAAAAASUVORK5CYII=",
                                             "label": "AbstractFeature",
                                             "width": 100,
                                             "height": 50
                                           },
                                           "ConcreteFeature": {
                                             "draw": "PHNoYXBlIG5hbWU9IlJvb3RGZWF0dXJlIiBhc3BlY3Q9InZhcmlhYmxlIiBzdHJva2V3aWR0aD0iNyI+DQoJPGJhY2tncm91bmQ+DQoJCTxzdHJva2Vjb2xvciBjb2xvcj0iIzQ0NmU3OSIvPg0KCQk8ZmlsbGNvbG9yIGNvbG9yPSIjZmZmZmZmIi8+DQoJCTxwYXRoPg0KCQkJPG1vdmUgeD0iMCIgeT0iMCIvPg0KCQkJPGxpbmUgeD0iMTAwIiB5PSIwIi8+DQoJCQk8bGluZSB4PSIxMDAiIHk9IjEwMCIvPg0KCQkJPGxpbmUgeD0iMCIgeT0iMTAwIi8+DQoJCQk8bGluZSB4PSIwIiB5PSIwIi8+DQoJCQk8Y2xvc2UvPiANCgkJPC9wYXRoPgkJDQoJPC9iYWNrZ3JvdW5kPg0KCTxmb3JlZ3JvdW5kPg0KCQk8ZmlsbHN0cm9rZS8+DQoJPC9mb3JlZ3JvdW5kPg0KPC9zaGFwZT4=",
                                             "icon": "iVBORw0KGgoAAAANSUhEUgAAACEAAAAQCAYAAACYwhZnAAAAR0lEQVRIS+2VMQoAMAgDk5dHX57SQpdCZ5f4AcNxGkoyhocALGksRnfjhLDnYJBMiKNASNxLCImQeL9inIgTXyeqaqxF9+4FTfM+fusqx+IAAAAASUVORK5CYII=",
                                             "label": "ConcreteFeature",
                                             "width": 100,
                                             "design": "shape=ConcreteFeature;",
                                             "height": 50
                                           }
                                         },
                                         "relationships": {
                                           "Bundle_Feature": {
                                             "styles": [
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=none;"
                                               }
                                             ],
                                             "label_property": "Type"
                                           },
                                           "RootFeature_Feature": {
                                             "styles": [
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=1;endSize=12;",
                                                 "linked_value": "Mandatory",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=0;endSize=12;",
                                                 "linked_value": "Optional",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=open;",
                                                 "linked_value": "Includes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;startArrow=open;endArrow=open;",
                                                 "linked_value": "Excludes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=none;",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;"
                                               }
                                             ],
                                             "label_property": "Type"
                                           },
                                           "AbstractFeature_Feature": {
                                             "styles": [
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=1;endSize=12;",
                                                 "linked_value": "Mandatory",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=0;endSize=12;",
                                                 "linked_value": "Optional",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=open;",
                                                 "linked_value": "Includes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;startArrow=open;endArrow=open;",
                                                 "linked_value": "Excludes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=none;",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;"
                                               }
                                             ],
                                             "label_property": "Type"
                                           },
                                           "ConcreteFeature_Feature": {
                                             "styles": [
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=1;endSize=12;",
                                                 "linked_value": "Mandatory",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=oval;endFill=0;endSize=12;",
                                                 "linked_value": "Optional",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=open;",
                                                 "linked_value": "Includes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;startArrow=open;endArrow=open;",
                                                 "linked_value": "Excludes",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;endArrow=none;",
                                                 "linked_value": "IndividualCardinality",
                                                 "linked_property": "Type"
                                               },
                                               {
                                                 "style": "strokeColor=#446E79;strokeWidth=2;"
                                               }
                                             ],
                                             "label_property": "Type"
                                           }
                                         }
                                       },
                                       "type": "DOMAIN",
                                       "stateAccept": "ACTIVE"
                                     }
                                   ]
                                 }
