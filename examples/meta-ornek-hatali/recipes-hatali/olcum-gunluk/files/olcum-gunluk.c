// SPDX-License-Identifier: MIT
// olcum-gunluk: ölçümleri zaman damgasıyla standart çıktıya yazar (benzetim)
#include <stdio.h>
#include <time.h>

int main(void)
{
    time_t simdi = time(NULL);
    char zaman[32];

    strftime(zaman, sizeof(zaman), "%Y-%m-%dT%H:%M:%S", gmtime(&simdi));
    printf("%s sensor0 21.0 C\n", zaman);
    return 0;
}
