const queue: { debateId: string; roundNumber: number; transcription: string }[] = []

export function addToQueue(item: { debateId: string; roundNumber: number; transcription: string }) {
  queue.push(item)
}

export function getQueue() {
  return [...queue]
}

export function clearQueue() {
  queue.length = 0
}

export function removeFromQueue(index: number) {
  queue.splice(index, 1)
}
