<?php

namespace Clockwork\Tests\Support\Storage;

class FakeRedisClient
{
    protected $hashes = [];
    protected $sortedSets = [];

    public function multi()
    {
        return $this;
    }

    public function exec()
    {
        return [];
    }

    public function expire($key, $ttl)
    {
        return true;
    }

    public function hMSet($key, array $data)
    {
        $this->hashes[$key] = $data;
        return true;
    }

    public function hGetAll($key)
    {
        return $this->hashes[$key] ?? [];
    }

    public function zAdd($key, $score, $member)
    {
        $this->sortedSets[$key][$member] = (float) $score;
        return true;
    }

    public function zRange($key, $start, $end)
    {
        return $this->sliceOrderedMembers($key, $start, $end, false);
    }

    public function zRevRange($key, $start, $end)
    {
        return $this->sliceOrderedMembers($key, $start, $end, true);
    }

    public function zRank($key, $member)
    {
        return $this->rank($key, $member, false);
    }

    public function zRevRank($key, $member)
    {
        return $this->rank($key, $member, true);
    }

    public function zCard($key)
    {
        return count($this->sortedSets[$key] ?? []);
    }

    public function del($key)
    {
        unset($this->hashes[$key], $this->sortedSets[$key]);
        return true;
    }

    public function zRemRangeByScore($key, $min, $max)
    {
        if (!isset($this->sortedSets[$key])) return 0;

        $removed = 0;

        foreach ($this->sortedSets[$key] as $member => $score) {
            if ($score >= $min && $score <= $max) {
                unset($this->sortedSets[$key][$member], $this->hashes[$member]);
                $removed++;
            }
        }

        return $removed;
    }

    protected function sliceOrderedMembers($key, $start, $end, $descending)
    {
        $members = $this->orderedMembers($key, $descending);
        $count = count($members);

        if ($count === 0) return [];

        if ($start < 0) $start = $count + $start;
        if ($end < 0) $end = $count + $end;

        $start = max(0, $start);
        $end = min($count - 1, $end);

        if ($start > $end) return [];

        return array_slice($members, $start, $end - $start + 1);
    }

    protected function rank($key, $member, $descending)
    {
        $members = $this->orderedMembers($key, $descending);
        $index = array_search($member, $members, true);

        return $index === false ? false : $index;
    }

    protected function orderedMembers($key, $descending)
    {
        $members = $this->sortedSets[$key] ?? [];

        uasort($members, function ($leftScore, $rightScore) use ($members) {
            if ($leftScore === $rightScore) return 0;
            return $leftScore <=> $rightScore;
        });

        $ordered = array_keys($members);

        usort($ordered, function ($left, $right) use ($members) {
            if ($members[$left] === $members[$right]) return strcmp($left, $right);
            return $members[$left] <=> $members[$right];
        });

        return $descending ? array_reverse($ordered) : $ordered;
    }
}
