# WhoIsFake

## Overview

WhoIsFake is a social deduction multiplayer web game for 3–5 players.

Most players know a secret word. One randomly selected player becomes the Impostor and does not know the word. The Impostor must blend in, avoid suspicion, and either guess the secret word or survive until only one other player remains.

---

# Core Gameplay

## Roles

### Regular Player

Receives:

* Secret word
* Category of the word

Goal:

* Identify the Impostor
* Help other players understand that you know the word
* Avoid revealing the word directly

---

### Impostor

Receives:

* Information that they are the Impostor
* Category hint
* Additional clue about the secret word

Does NOT receive:

* The actual secret word

Goal:

* Blend in with other players
* Avoid being voted out
* Guess the secret word
* Reach a 1v1 situation

---

# Game Flow

## 1. Create or Join Game

Players can:

* Create a room
* Join a room using a room code

Required information:

* Nickname

---

## 2. Lobby

Features:

* Room code
* Player list
* Ready status
* Host controls
* Start game button

Player count:

* Minimum: 3
* Maximum: 5

Examples:

* 3 Players → 2 Regular + 1 Impostor
* 4 Players → 3 Regular + 1 Impostor
* 5 Players → 4 Regular + 1 Impostor

---

## 3. Role Assignment

System randomly selects:

* Secret word
* Category
* Impostor

Categories may include:

* Animals
* Food
* Objects
* Professions
* Places
* Nature
* Sports
* Technology

Example:

Category:

Animal

Secret Word:

Tiger

Regular Players See:

Tiger

Impostor Sees:

You are the Impostor

Hint:

Large wild cat

---

## 4. Clue Round

Each player submits one clue.

Rules:

* Single word or short phrase
* Cannot use the secret word
* Cannot spell the secret word
* Cannot directly reveal the answer

Example:

Secret Word:

Tiger

Clues:

* Stripes
* Jungle
* Predator
* Fast

---

## 5. Discussion Phase

Players discuss clues.

Goals:

* Find suspicious players
* Determine who may be the Impostor
* Defend yourself if accused

---

## 6. Voting

Any player can initiate a vote.

Process:

1. Vote starts
2. All active players vote
3. Results are revealed
4. Player with most votes is eliminated

Tie:

* No elimination
* Continue to next round

---

## 7. Impostor Guess Opportunity

After each completed round the Impostor may:

### Option A

Attempt to guess the secret word

If correct:

Impostor wins instantly

If incorrect:

Game continues

### Option B

Skip guessing

Continue blending in

---

# Win Conditions

## Regular Players Win

When:

* Impostor is eliminated through voting

---

## Impostor Wins

When:

### Scenario 1

Correctly guesses the secret word

OR

### Scenario 2

Only two players remain alive

Impostor + One Regular Player

---

# Screens

## Landing Page

Components:

* Logo
* Hero section
* Create Game button
* Join Game button
* How It Works section
* Feature cards

---

## Create Room

Fields:

* Nickname
* Max players

Buttons:

* Create Room

Result:

* Room code generated

---

## Join Room

Fields:

* Nickname
* Room code

Buttons:

* Join Room

---

## Lobby

Components:

* Room code
* Copy room code
* Player cards
* Ready indicators
* Start game button
* Leave room button

---

## Role Reveal Screen

### Regular Player

Display:

* Secret word
* Category

Button:

* Continue

---

### Impostor

Display:

* You Are The Impostor
* Hint
* Category

Button:

* Continue

---

## Main Game Screen

Sections:

### Player List

Shows:

* Active players
* Eliminated players

### Round Information

Displays:

* Round number
* Current phase

### Clue Input

Input:

* Text field

Button:

* Submit Clue

### Clue History

Shows clues from:

* Current round
* Previous rounds

### Actions

Buttons:

* Start Vote
* Guess Word (Impostor only)

---

## Voting Modal

Displays:

* All active players

Actions:

* Select player
* Confirm vote

Timer:

* Countdown

---

## Round Results

Displays:

* Eliminated player
* Vote summary
* Remaining players

---

## End Game Screen

Displays:

* Winning side
* Secret word
* Impostor identity
* Statistics

Buttons:

* Play Again
* Return Home

---

# Database Models

## User

```
id
nickname
createdAt
```

## Room

```
id
code
hostId
status
maxPlayers
createdAt
```

## Player

```
id
roomId
userId
role
isAlive
isReady
```

## Game

```
id
roomId
secretWord
category
currentRound
status
```

## Clue

```
id
gameId
playerId
content
round
```

## Vote

```
id
gameId
voterId
targetId
round
```

---

# Tech Stack Recommendation

Frontend:

* Next.js
* React
* TypeScript
* TailwindCSS
* shadcn/ui

Backend:

* Node.js
* NestJS

Database:

* PostgreSQL

Realtime:

* Socket.IO

Hosting:

* Vercel
* Railway
* Supabase

Authentication:

* Guest nickname system
* Optional Google login

---

# Design Direction

Theme:

Modern Gaming Platform

Style:

* Dark Mode
* Glassmorphism
* Neon Accents
* Clean Layouts
* Responsive Design

Colors:

Primary:
#2563EB

Accent:
#06B6D4

Danger:
#EF4444

Warning:
#F97316

Background:
#0F172A

Surface:
#111827

Inspirations:

* Discord
* Among Us
* Valorant
* Jackbox Games
* Gartic Phone

---

# Future Features

* Ranked mode
* Voice chat
* Private rooms
* Spectator mode
* Statistics
* Match history
* Achievements
* Mobile app
* Custom categories
* AI-generated words

