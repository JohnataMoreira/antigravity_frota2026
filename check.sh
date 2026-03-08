docker service ls -q > /tmp/services.txt
while read s; do
  NAME=$(docker service inspect $s --format '{{.Spec.Name}}')
  CPU=$(docker service inspect $s --format '{{.Spec.TaskTemplate.Resources.Reservations.NanoCPUs}}')
  MEM=$(docker service inspect $s --format '{{.Spec.TaskTemplate.Resources.Reservations.MemoryBytes}}')
  echo "$NAME CPU: $CPU MEM: $MEM"
done < /tmp/services.txt
