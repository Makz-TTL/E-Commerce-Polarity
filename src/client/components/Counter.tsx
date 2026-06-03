type InputProps = {
  count: number
}

const Counter = (props: InputProps) => {
  return (
    <span id="counter" class="text-xl font-medium">
      Count: {props.count}
    </span>
  )
}

export default Counter
