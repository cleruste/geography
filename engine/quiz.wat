(module
  (import "host" "random_index" (func $random-index (param i32) (result i32)))
  (memory 1) ;; Pool indices, stored as 32-bit values.
  (global $count (mut i32) (i32.const 0))
  (global $size (mut i32) (i32.const 0))
  (global $turn (export "turn") (mut i32) (i32.const 0))
  (global $score (export "score") (mut i32) (i32.const 0))
  (global $streak (export "streak") (mut i32) (i32.const 0))
  (global $best (export "best_streak") (mut i32) (i32.const 0))
  (global $answered (export "answered") (mut i32) (i32.const 0))
  (global $complete (mut i32) (i32.const 0))

  (func $address (param $index i32) (result i32)
    (i32.shl (local.get $index) (i32.const 2)))

  (func $question (export "question") (param $index i32) (result i32)
    (i32.load (call $address (local.get $index))))

  (func (export "start") (param $pool i32) (param $count-limit i32)
    (local $i i32) (local $j i32) (local $temp i32)
    (global.set $size (local.get $pool))
    (global.set $count (select (local.get $pool) (local.get $count-limit)
      (i32.lt_u (local.get $pool) (local.get $count-limit))))
    (block $initialized
      (loop $initialize
        (br_if $initialized (i32.ge_u (local.get $i) (local.get $pool)))
        (i32.store (call $address (local.get $i)) (local.get $i))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $initialize)))
    ;; Fisher–Yates shuffle, matching the JavaScript engine.
    (block $shuffled
      (loop $shuffle
        (br_if $shuffled (i32.le_u (local.get $i) (i32.const 1)))
        (local.set $j (call $random-index (local.get $i)))
        (local.set $i (i32.sub (local.get $i) (i32.const 1)))
        (local.set $temp (call $question (local.get $i)))
        (i32.store (call $address (local.get $i)) (call $question (local.get $j)))
        (i32.store (call $address (local.get $j)) (local.get $temp))
        (br $shuffle))))

  ;; Answer returns -1 for an invalid action, 0 for wrong, 1 for correct.
  (func (export "answer") (param $selection i32) (result i32)
    (if (i32.or (global.get $answered) (i32.ge_u (local.get $selection) (global.get $size)))
      (then (return (i32.const -1))))
    (global.set $answered (i32.const 1))
    (if (i32.eq (local.get $selection) (call $question (global.get $turn)))
      (then
        (global.set $score (i32.add (global.get $score) (i32.const 1)))
        (global.set $streak (i32.add (global.get $streak) (i32.const 1)))
        (if (i32.gt_u (global.get $streak) (global.get $best))
          (then (global.set $best (global.get $streak))))
        (return (i32.const 1))))
    (global.set $streak (i32.const 0))
    (i32.const 0))

  ;; Next returns 0 if blocked, 1 if advanced, 2 on first completion.
  (func (export "next") (result i32)
    (if (i32.or (i32.eqz (global.get $answered)) (global.get $complete))
      (then (return (i32.const 0))))
    (if (i32.eq (i32.add (global.get $turn) (i32.const 1)) (global.get $count))
      (then
        (global.set $complete (i32.const 1))
        (return (i32.const 2))))
    (global.set $turn (i32.add (global.get $turn) (i32.const 1)))
    (global.set $answered (i32.const 0))
    (i32.const 1)))
