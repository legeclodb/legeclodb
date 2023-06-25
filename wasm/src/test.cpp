#include "lookup.h"
#include "util.h"

namespace ldb::lookup {

#ifdef _DEBUG

struct LifecycleTest
{
    LifecycleTest(int d = 0) : data_(d)
    {
        printf("LifecycleTest(%d)\n", data_);
    }
    LifecycleTest(const LifecycleTest& v) noexcept
    {
        data_ = v.data_;
        printf("LifecycleTest(const LifecycleTest&) %d\n", data_);
    }
    LifecycleTest(LifecycleTest&& v) noexcept
    {
        data_ = v.data_;
        v.data_ = -v.data_;
        printf("LifecycleTest(LifecycleTest&&) %d\n", data_);
    }
    ~LifecycleTest()
    {
        printf("~LifecycleTest() %d\n", data_);
    }
    LifecycleTest& operator=(const LifecycleTest& v) noexcept
    {
        data_ = v.data_;
        printf("operator=(const LifecycleTest&) %d\n", data_);
        return *this;
    }
    LifecycleTest& operator=(LifecycleTest&& v) noexcept {
        data_ = v.data_;
        v.data_ = -v.data_;
        printf("operator=(LifecycleTest&&) %d\n", data_);
        return *this;
    }

    int data_ = 0;
};
#endif // _DEBUG


void LookupContext::test(em::val v)
{
    printf("GlobalContext::test()\n");

#ifdef _DEBUG
    // checks
    {
        printf("size of ResultHolder: %d\n", (int)sizeof(ResultHolder));
    }

    // test algorithm
    {
        struct Hoge { int data{}; };
        Hoge testData[5]{ {10}, {5}, {4}, {9}, {2} };
        Hoge* testPtr[5]{ &testData[0], &testData[1], &testData[2], &testData[3], &testData[4], };

        sortByScore(std::span<Hoge*>(testPtr), [](Hoge* p){ return (float)p->data * 2; });
        printf("sortByScore: ");
        for (auto& v : testPtr)
            printf("%d ", v->data);
        printf("\n");
    }

    {
        {
            printf("erase test1\n");
            std::vector<LifecycleTest> data;
            data.reserve(10);
            for (int i = 0; i < 4; ++i) {
                data.emplace_back(i);
            }
            printf("before insert\n");
            data.insert(data.begin() + 2, LifecycleTest(10));
            printf("after insert\n");
        }
        {
            printf("erase test2\n");
            ist::fixed_vector<LifecycleTest, 10> data;
            for (int i = 0; i < 4; ++i) {
                data.emplace_back(i);
            }
            printf("before insert\n");
            data.insert(data.begin() + 2, LifecycleTest(10));
            printf("after insert\n");
        }
    }

    objectEach(v, [](val key, val val) {
        printf("%s: %d\n", key.as<std::string>().c_str(), val.as<int>());
        });
#endif // _DEBUG
}

} // namespace ldb::lookup
